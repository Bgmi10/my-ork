import { sendResponse, sendError, HTTP_STATUS } from "../lib/response"
import crypto from "crypto"
import prisma from "../prisma"
import express from "express"
import dotenv from "dotenv"

dotenv.config()

export const sendInvites = async (req: express.Request, res: express.Response) => {
  try {
    const { teamId, emails, message } = req.body

    if (!teamId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Team ID and emails are required")
    }

    // Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { department: true },
    })

    if (!team) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Team not found")
    }

    const invites = []
    const emailPromises = []

    for (const email of emails) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, "User already exists")
      }

      // Check if invite already exists
      const existingInvite = await prisma.invite.findFirst({
        where: { email, teamId, expiresAt: { gt: new Date() } },
      })

      if (existingInvite) {
        return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invite already sent");
      }

      // Create invite
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const invite = await prisma.invite.create({
        data: {
          email,
          teamId,
          token,
          expiresAt,
          role: "MEMBER",
        },
      })

      invites.push(invite)

      // Send email
      const inviteLink = `${process.env.NODE_ENV === "local" ? process.env.FRONTEND_DEV_URL : process.env.FRONTEND_PROD_URL}/accept-invite?token=${token}`
      const emailPromise = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_SECRET || "",
        },
        body: JSON.stringify({
          sender: { name: "MyOKR", email: process.env.FROM_EMAIL },
          to: [{ email }],
          subject: `Invitation to join ${team.name} on MyOKR`,
          htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You're invited to join ${team.name}!</h2>
            <p>${message}</p>
            <p>Team: ${team.name}</p>
            <p>Department: ${team.department.name}</p>
            <a href="${inviteLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
              Accept Invitation
            </a>
            <p>This invitation will expire in 1 day.</p>
            <p>If you can't click the button, copy and paste this link: ${inviteLink}</p>
          </div>`,
        }),
      })
      

      emailPromises.push(emailPromise)
    }

    // Send all emails
    await Promise.all(emailPromises)

    return sendResponse(res, HTTP_STATUS.CREATED, "Invitations sent successfully", {
      invitesSent: invites.length,
      invites,
    })
  } catch (error) {
    console.error("Send invites error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to send invitations", error)
  }
}

export const acceptInvite = async (req: express.Request, res: express.Response) => {
  try {
    const { name, token } = req.body

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { team: true },
    })

    if (!invite) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Invalid invitation token")
    }

    if (invite.expiresAt < new Date()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invitation has expired")
    }

    if (invite.acceptedAt) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invitation already accepted")
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    })

    if (existingUser) {
      // Update existing user's team
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { teamId: invite.teamId },
      })

      // Mark invite as accepted
      await prisma.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      })

      return sendResponse(res, HTTP_STATUS.OK, "Invitation accepted successfully", { user })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        role: invite.role,
        teamId: invite.teamId,
        isVerified: true,
      },
    })

    // Mark invite as accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })

    return sendResponse(res, HTTP_STATUS.CREATED, "User created and invitation accepted", { user })
  } catch (error) {
    console.error("Accept invite error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to accept invitation", error)
  }
}

export const getInviteDetails = async (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.params

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        team: {
          include: {
            department: true,
          },
        },
      },
    })

    if (!invite) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Invalid invitation token")
    }

    if (invite.expiresAt < new Date()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invitation has expired")
    }

    if (invite.acceptedAt) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Invitation already accepted")
    }

    return sendResponse(res, HTTP_STATUS.OK, "Invite details retrieved", {
      email: invite.email,
      team: invite.team,
      role: invite.role,
      expiresAt: invite.expiresAt,
    })
  } catch (error) {
    console.error("Get invite details error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to get invite details", error)
  }
}
