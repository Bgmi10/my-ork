import { Router } from "express"
import { generateOKRSuggestion } from "../controllers/ai-okr-suggestion"

const aiokrSuggestionRoutes = Router()

aiokrSuggestionRoutes.post("/generate-okr-suggestion", generateOKRSuggestion)

export default aiokrSuggestionRoutes
