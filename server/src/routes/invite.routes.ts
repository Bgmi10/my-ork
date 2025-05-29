import express from "express"
import { sendInvites, acceptInvite, getInviteDetails } from "../controllers/InviteController"

const inviteRouter = express.Router()

inviteRouter.post("/", sendInvites);
inviteRouter.post("/accept", acceptInvite);
inviteRouter.get("/details", getInviteDetails);

export default inviteRouter
