import { sendResponse, sendError, HTTP_STATUS } from "../lib/response"
import prisma from "../prisma"
import express from "express"


export const createDepartment = async (req: express.Request, res: express.Response) => {
  try {
    const { name, teamIds, organizationId } = req.body

    if (!name) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, "Department name is required")
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        organizationId,
      },
    })

    // Assign teams to department if provided
    if (teamIds && teamIds.length > 0) {
      await prisma.team.updateMany({
        where: {
          id: {
            in: teamIds,
          },
        },
        data: {
          departmentId: department.id,
        },
      })
    }

    // Fetch the created department with teams
    const departmentWithTeams = await prisma.department.findUnique({
      where: { id: department.id },
      include: {
        teams: {
          include: {
            _count: {
              select: {
                users: true,
                objectives: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    })

    return sendResponse(res, HTTP_STATUS.CREATED, "Department created successfully", departmentWithTeams)
  } catch (error) {
    console.error("Create department error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to create department", error)
  }
}

export const getDepartments = async (req: express.Request, res: express.Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        teams: {
          include: {
            _count: {
              select: {
                users: true,
                objectives: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    })

    return sendResponse(res, HTTP_STATUS.OK, "Departments retrieved successfully", departments)
  } catch (error) {
    console.error("Get departments error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to retrieve departments", error)
  }
}

export const getDepartmentById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
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
              },
            },
            _count: {
              select: {
                users: true,
                objectives: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    })

    if (!department) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Department not found")
    }

    return sendResponse(res, HTTP_STATUS.OK, "Department retrieved successfully", department)
  } catch (error) {
    console.error("Get department error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to retrieve department", error)
  }
}

export const updateDepartment = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params
    const { name, teamIds } = req.body

    // Update department
    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
      },
    })

    // Update team assignments if provided
    if (teamIds !== undefined) {
      // First, remove all teams from this department
      await prisma.team.updateMany({
        where: { departmentId: id },
        data: { departmentId: undefined },
      })

      // Then assign new teams
      if (teamIds.length > 0) {
        await prisma.team.updateMany({
          where: {
            id: {
              in: teamIds,
            },
          },
          data: {
            departmentId: id,
          },
        })
      }
    }

    // Fetch updated department with teams
    const updatedDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            _count: {
              select: {
                users: true,
                objectives: true,
              },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    })

    return sendResponse(res, HTTP_STATUS.OK, "Department updated successfully", updatedDepartment)
  } catch (error) {
    console.error("Update department error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to update department", error)
  }
}

export const deleteDepartment = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params

    await prisma.department.delete({
      where: { id },
    })

    return sendResponse(res, HTTP_STATUS.OK, "Department deleted successfully")
  } catch (error) {
    console.error("Delete department error:", error)
    return sendError(res, HTTP_STATUS.INTERNAL_SERVER, "Failed to delete department", error)
  }
}
