import { NextRequest, NextResponse } from "next/server";
import { answerDocumentQuestion } from "@/lib/gemini/generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptInstruction, relevantChunks } = body;

    if (!promptInstruction || !relevantChunks || !Array.isArray(relevantChunks)) {
      return NextResponse.json(
        { error: "Missing promptInstruction or relevantChunks" },
        { status: 400 }
      );
    }

    if (relevantChunks.length === 0) {
      return NextResponse.json({ result: "I couldn't find enough information in the document to complete this task." });
    }

    // Format context
    const context = relevantChunks
      .map((chunk: { pageNumber: number, text: string }) => `[Page ${chunk.pageNumber}]\n${chunk.text}`)
      .join("\n\n");

    const finalPrompt = `Task Instruction: ${promptInstruction}`;

    const result = await answerDocumentQuestion(context, finalPrompt);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Tools API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
