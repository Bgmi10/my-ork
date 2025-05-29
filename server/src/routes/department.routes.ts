import express from "express"
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment } from "../controllers/departmentController"

const departmentRouter = express.Router()

departmentRouter.post("/", createDepartment)
departmentRouter.get("/", getDepartments)
departmentRouter.get("/:id", getDepartmentById)
departmentRouter.put("/:id", updateDepartment)
departmentRouter.delete("/:id", deleteDepartment)

export default departmentRouter

