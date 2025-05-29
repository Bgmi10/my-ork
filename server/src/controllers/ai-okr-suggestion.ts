import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import dotenv from "dotenv"

dotenv.config()

interface SuggestionRequest {
  field: "title" | "description" | "keyResultTitle"
  text: string
  context: {
    title?: string
    description?: string
    keyResults?: Array<{
      title: string
      targetValue: number
      currentValue: number
    }>
    currentIndex?: number
  }
}

export async function generateOKRSuggestion(request: any, res: any) {
  const { field, text, context } = request.body;

  if (!text) {
    return { suggestion: "" }
  }

  let prompt = ""
  let systemPrompt = ""

  // Build system prompt based on field type
  if (field === "title") {
    systemPrompt = `You are an AI assistant that helps users write effective OKR (Objectives and Key Results) titles.
    Your suggestions should be concise, clear, and follow best practices for OKRs.
    Complete the user's title in a way that makes it specific, measurable, and inspiring.
    Only provide the completed title text, nothing else.`

    prompt = `I'm writing an OKR title and have started with: "${text}"
    Context:
    ${context.description ? `Description so far: ${context.description}` : "No description yet"}
    ${context.keyResults?.length > 0 ? `Key Results so far: ${context.keyResults.map((kr: any) => kr.title).join(", ")}` : "No key results yet"}
    
    Please complete my title in a way that makes it a strong OKR objective.`
  } else if (field === "description") {
    systemPrompt = `You are an AI assistant that helps users write effective OKR (Objectives and Key Results) descriptions.
    Your suggestions should be detailed, clear, and explain why this objective matters.
    Complete the user's description in a way that provides context and rationale for the objective.
    Only provide the completed description text, nothing else.`

    prompt = `I'm writing an OKR description and have started with: "${text}"
    Context:
    ${context.title ? `Objective title: ${context.title}` : "No title yet"}
    ${context.keyResults?.length > 0 ? `Key Results so far: ${context.keyResults.map((kr: any) => kr.title).join(", ")}` : "No key results yet"}
    
    Please complete my description in a way that makes it clear and compelling.`
  } else if (field === "keyResultTitle") {
    systemPrompt = `You are an AI assistant that helps users write effective Key Results for OKRs.
    Your suggestions should be specific, measurable, and aligned with the objective.
    Complete the user's key result title in a way that makes it quantifiable and time-bound.
    Only provide the completed key result text, nothing else.`

    prompt = `I'm writing a Key Result title and have started with: "${text}"
    Context:
    ${context.title ? `Objective title: ${context.title}` : "No objective title yet"}
    ${context.description ? `Objective description: ${context.description}` : "No description yet"}
    ${
      context.keyResults?.length > 0
        ? `Other Key Results: ${context.keyResults
            .filter((_: any, i: any) => i !== context.currentIndex)
            .map((kr: any) => kr.title)
            .filter((title: any) => title)
            .join(", ")}`
        : "No other key results yet"
    }
    
    Please complete my key result in a way that makes it specific, measurable, and aligned with the objective.`
  }

  try {
    // Generate AI suggestion
    const { text: suggestion } = await generateText({
      model: groq("llama3-70b-8192", {
        //@ts-ignore
        apiKey: process.env.GROQ_API_KEY,
      }),
      prompt,
      system: systemPrompt,
      maxTokens: 100,
    })

    // Clean up the suggestion to ensure it starts with the user's input
    let cleanedSuggestion = suggestion.trim()

    // If the suggestion doesn't start with the user's input, prepend it
    if (!cleanedSuggestion.toLowerCase().startsWith(text.toLowerCase())) {
      cleanedSuggestion = text + cleanedSuggestion
    }

    return res.status(200).json({ suggestion: cleanedSuggestion })
  } catch (error) {
    console.error("Error generating OKR suggestion:", error)
    return res.status(500).json({ error: "Failed to generate suggestion" })
  }
}
