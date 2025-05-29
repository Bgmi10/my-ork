import { sendResponse, sendError, HTTP_STATUS } from "../lib/response"
import crypto from "crypto" 
import prisma from "../prisma"
import express from "express"

export const createTeam = async (req: express.Request, res: express.Response) => {
  try {
    const { name, departmentId, teamLeaderId, inviteEmails, message } = req.body

    if (!name || !departmentId) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Team name and department are required")
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    })

    if (!department) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Department not found")
    }

    // Validate team leader if provided
    if (teamLeaderId) {
      const teamLeader = await prisma.user.findUnique({
        where: { id: teamLeaderId },
      })

      if (!teamLeader) {
        return sendError(res, HTTP_STATUS.NOT_FOUND, "Team leader not found")
      }
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        departmentId,
      },
      include: {
        department: true,
        users: true,
      },
    })

    // Assign team leader if provided
    if (teamLeaderId) {
      await prisma.user.update({
        where: { id: teamLeaderId },
        data: {
          teamId: team.id,
          role: "MANAGER",
        },
      })
    }

    // Send invites if emails provided
    if (inviteEmails && inviteEmails.length > 0) {
      const invites = []
      const emailPromises = []

      for (const email of inviteEmails) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          // Add existing user to team
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { teamId: team.id },
          })
          continue
        }

        // Create invite
        const token = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        const invite = await prisma.invite.create({
          data: {
            email,
            teamId: team.id,
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
              <p>${message || "I am inviting you to MyOKR, OKR management tool, where you can add, create, manage, and track your OKRs."}</p>
              <p>Team: ${team.name}</p>
              <p>Department: ${department.name}</p>
              <a href="${inviteLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">
                Accept Invitation
              </a>
              <p>This invitation will expire in 7 days.</p>
            </div>
          `,
          }),
        })

        emailPromises.push(emailPromise)
      }

      await Promise.all(emailPromises)
    }

    return sendResponse(res, HTTP_STATUS.CREATED, "Team created successfully", team)
  } catch (error) {
    console.error("Create team error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to create team", error)
  }
}

export const getTeams = async (req: express.Request, res: express.Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        department: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            objectives: true,
          },
        },
      },
    })

    return sendResponse(res, HTTP_STATUS.OK, "Teams retrieved successfully", teams)
  } catch (error) {
    console.error("Get teams error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to retrieve teams", error)
  }
}

export const getTeamById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        department: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        objectives: {
          include: {
            keyResults: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!team) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Team not found")
    }

    return sendResponse(res, HTTP_STATUS.OK, "Team retrieved successfully", team)
  } catch (error) {
    console.error("Get team error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to retrieve team", error)
  }
}

export const updateTeam = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { name, departmentId } = req.body

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(departmentId && { departmentId }),
      },
      include: {
        department: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return sendResponse(res, HTTP_STATUS.OK, "Team updated successfully", team)
  } catch (error) {
    console.error("Update team error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to update team", error)
  }
}

export const deleteTeam = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params

    await prisma.team.delete({
      where: { id },
    })

    return sendResponse(res, HTTP_STATUS.OK, "Team deleted successfully")
  } catch (error) {
    console.error("Delete team error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to delete team", error)
  }
}
