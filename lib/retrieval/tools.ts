import { retrieveRelevantContext } from "./retrieve";
import { answerDocumentQuestion } from "../gemini/generate";
import { DocumentChunk } from "@/types/retrieval";

type ToolType = "summarize" | "detailed_summary" | "key_points" | "study_notes" | "explain" | "quiz" | "important_concepts";

export async function executeTool(documentId: string, tool: ToolType, params?: Record<string, string>): Promise<string> {
  let query = "";
  let topK = 5;
  let promptInstruction = "";

  switch (tool) {
    case "summarize":
      query = "introduction, abstract, conclusion, main findings, summary, overview";
      topK = 6;
      promptInstruction = "Generate a concise, high-level summary of the document based on the provided context. Focus on the main purpose and overall conclusion.";
      break;
    case "detailed_summary":
      query = "introduction, methodology, results, conclusion, main findings, chapters, overview";
      topK = 10;
      promptInstruction = "Generate a comprehensive, detailed summary of the document based on the provided context. Organize your response with clear headings (e.g., Introduction, Key Findings, Conclusion) if applicable.";
      break;
    case "key_points":
      query = "important concepts, key takeaways, main ideas, bullet points, core arguments";
      topK = 6;
      promptInstruction = "Extract the most important key points from the provided context. Format them as a clear, easy-to-read bulleted list.";
      break;
    case "study_notes":
      query = "definitions, formulas, key arguments, concepts, important points, summary";
      topK = 8;
      promptInstruction = "Generate structured study notes based on the provided context. Use headings, bullet points, and bold text for key terms to make it easy to study.";
      break;
    case "explain":
      const concept = params?.concept;
      if (!concept) throw new Error("Concept parameter is required for the 'explain' tool.");
      query = concept;
      topK = 5;
      promptInstruction = `Explain the concept of "${concept}" simply and clearly, using only the provided context. Imagine you are explaining it to someone who is new to the subject.`;
      break;
    case "quiz":
      const difficulty = params?.difficulty || "Intermediate";
      query = "key facts, statistics, important concepts, main arguments, definitions";
      topK = 8;
      promptInstruction = `Generate a quiz based on the provided context. The difficulty level should be ${difficulty}. Include 3-5 questions. For each question, provide the correct answer immediately below it, clearly marked or hidden in a spoiler format if possible (or just label it 'Answer:'). Only use facts present in the context.`;
      break;
    case "important_concepts":
      query = "important concepts, key takeaways, main ideas, definitions, core themes";
      topK = 6;
      promptInstruction = "Identify and list the most important concepts a reader should understand after reading this document, based on the provided context. Briefly define each concept.";
      break;
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }

  // 1. Retrieve targeted chunks based on the tool's synthetic query
  const chunks = await retrieveRelevantContext(documentId, query, topK);
  
  if (!chunks || chunks.length === 0) {
    return "I couldn't find enough information in the document to complete this task.";
  }

  // 2. Format context
  const context = chunks
    .map((chunk) => `[Page ${chunk.pageNumber}]\n${chunk.text}`)
    .join("\n\n");

  // 3. Create the final prompt for Gemini
  const finalPrompt = `
Task Instruction:
${promptInstruction}

Document Context:
${context}
  `.trim();

  // 4. Generate the response
  // We can reuse the `answerDocumentQuestion` function since it is designed to take context and a prompt
  const result = await answerDocumentQuestion(context, `Task Instruction: ${promptInstruction}`);
  
  return result;
}
