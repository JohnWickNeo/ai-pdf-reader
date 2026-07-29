import { NextRequest, NextResponse } from "next/server";
import { answerDocumentQuestion } from "@/lib/gemini/generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, relevantChunks } = body;

    if (!message || !relevantChunks || !Array.isArray(relevantChunks)) {
      return NextResponse.json(
        { error: "Missing message or relevantChunks" },
        { status: 400 }
      );
    }
    
    // Format context for Gemini
    const context = relevantChunks
      .map((chunk: { pageNumber: number, text: string }) => `[Page ${chunk.pageNumber}]\n${chunk.text}`)
      .join("\n\n");

    const answer = await answerDocumentQuestion(context, message);

    const sources = Array.from(new Set(relevantChunks.map((c: { pageNumber: number }) => c.pageNumber))).sort((a, b) => a - b);

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
