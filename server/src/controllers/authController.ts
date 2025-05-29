import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendResponse, sendError, HTTP_STATUS } from '../lib/response';
import { sendEmailViaBrevo } from '../utils/sendEmailViaBrevo';
import { getOtpHtmlTemplate } from '../utils/getOtpHtmlTemplate';
import prisma from '../prisma';
import { User } from '@prisma/client';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateJWT = (user: User): string => {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email, type , name } = req.body;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create OTP record
    await prisma.oTP.create({
      data: {
        email,
        otpCode: otp,
        expiresAt,
        used: false,
      },
    });

    // Create user if doesn't exist (for signup)
    if (type === 'signup') {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email,
            name,
            isVerified: false,
            role: 'ADMIN',
          },
        });
      }
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (!existingUser) {
        return sendError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            'User not found'
        )
    }

    // Send email
    const emailSent = await sendEmailViaBrevo({
      to: [{ email }],
      subject: `MyOKR ${type.charAt(0).toUpperCase() + type.slice(1)} Verification`,
      htmlContent: getOtpHtmlTemplate(type, otp),
    });

    if (!emailSent) {
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER,
        'Failed to send OTP email'
      );
    }

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'OTP sent successfully'
    );
  } catch (err) {
    console.error('Send OTP error:', err);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER,
      'Failed to send OTP',
      err
    );
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    // Find valid OTP
    const otp = await prisma.oTP.findFirst({
      where: {
        email,
        otpCode: code,
        expiresAt: { gt: new Date() },
        used: false,
      },
    });

    if (!otp) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Invalid or expired OTP'
      );
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Get or verify user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    // Update user verification status
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    // Generate JWT
    const token = generateJWT(user);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'OTP verified successfully',
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          team: user.team,
          isVerified: true,
        },
      }
    );
  } catch (err) {
    console.error('Verify OTP error:', err);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER,
      'Failed to verify OTP',
      err
    );
  }
};

export const profile = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user;

    let user;
    if (role === 'ADMIN') {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          team: true,
          organization: {
            include: {
              departments: {
                include: {
                  teams: {
                    include: {
                      users: true,
                      objectives: true,
                    },
                  },
                },
              },
            }
          },
          objectives: {
            include: {
              keyResults: true
            }
          }
        }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },  
        include: {
          team: {
            include: {
              department: {
                include: {
                  organization: {
                    include: {
                      user: true
                    }
                  }
                }
              },
              users: {
                where: {
                  OR: [
                    { role: 'MEMBER' },
                    { role: 'ADMIN' }
                  ]
                }
              },
              objectives: true,
            }
          },
          objectives: {
            include: {
              keyResults: true
            }
          }
        }
      });
    }

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    return sendResponse(res, HTTP_STATUS.OK, 'Profile fetched successfully', user);
  } catch (err) {
    console.error('Profile error:', err);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to fetch profile', err);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    return sendResponse(
      res,
      HTTP_STATUS.OK,
      'Logged out successfully'
    );
  } catch (err) {
    console.error('Logout error:', err);
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER,
      'Failed to logout',
      err
    );
  }
}; 

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;

    const checkUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!checkUser) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    if (email && email !== checkUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email already exists');
      }
    }

    // Dynamically build the update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return sendResponse(res, HTTP_STATUS.OK, 'Profile updated successfully', updatedUser);
  } catch (err) {
    console.error('Update profile error:', err);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to update profile', err);
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    
    await prisma.user.delete({
      where: { id: userId }
    })

    return sendResponse(res, HTTP_STATUS.OK, 'Profile deleted successfully');
  } catch (err) {
    console.error('Delete profile error:', err);
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, 'Failed to delete profile', err);
  }
};