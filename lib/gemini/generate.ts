import { geminiClient, withRetry } from "./client";

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
You are a helpful AI assistant tasked with answering questions about a specific document.
You will be provided with context extracted from the document, organized by page.

Instructions:
1. Answer the question using ONLY the supplied document context.
2. Do not fabricate information.
3. If the answer is not contained in the supplied context, clearly say: "I could not find the answer to this in the document."
4. Be clear, concise, and helpful.
5. When possible, mention the relevant page number(s) you used to find the answer.
`;

export async function generateText(prompt: string): Promise<string> {
  try {
    const response = await geminiClient.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini generateText error:", error);
    throw new Error("Failed to generate text from Gemini");
  }
}

export async function answerDocumentQuestion(
  context: string,
  question: string
): Promise<string> {
  const prompt = `
Context from Document:
${context}

User Question:
${question}
`;

  try {
    const systemInstruction = `You are a helpful AI assistant tasked with answering questions based ONLY on the provided document context.
Your instructions:
1. Base your answer strictly on the provided context.
2. If the answer is not explicitly or implicitly contained in the context, you must state that you do not know. Do NOT fabricate information.
3. Be clear, concise, and direct.
4. When relevant, cite the specific page numbers that informed your answer.`;

    const response = await withRetry(() => 
      geminiClient.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1, // Low temperature for more factual responses
        },
      })
    );

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini generation failed:", error);
    throw new Error("Failed to generate response. Please try again later.");
  }
}
