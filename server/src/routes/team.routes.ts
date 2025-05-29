import express from "express"
import { createTeam, getTeams, getTeamById, updateTeam, deleteTeam } from "../controllers/teamController"

const teamRouter = express.Router()

teamRouter.post("/", createTeam)
teamRouter.get("/", getTeams)
teamRouter.get("/:id", getTeamById)
teamRouter.put("/:id", updateTeam)
teamRouter.delete("/:id", deleteTeam)

export default teamRouter
 