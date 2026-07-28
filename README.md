# AI PDF Reader

A production-ready, RAG-powered PDF reader built with Next.js and the Gemini API. It allows you to upload large PDFs, read them in an integrated split-screen interface, and seamlessly chat with an AI assistant to summarize, query, and extract insights directly grounded in your document.

## Features

- **Robust PDF Processing**: Uploads are processed in a highly reliable, client-driven pipeline (Extract -> Embed) that prevents timeouts on serverless deployments (like Vercel). Graceful handling of large files and robust error states.
- **Retrieval-Augmented Generation (RAG)**: To ensure high performance, low latency, and low cost, this application parses uploaded PDFs into smaller semantic chunks. When you ask a question, it queries a custom vector store to retrieve only the most relevant sections of the document to feed to Gemini.
- **Interactive Chat Interface**: Chat with your document! Includes suggested questions, local conversation history, and clickable source links that navigate the PDF viewer directly to the page Gemini used to answer your question.
- **AI Tools Panel**: Generate Study Notes, Detailed Summaries, Quizzes, and Concept Explanations with specialized RAG prompt engineering. Easily export outputs to Markdown files.
- **Enterprise-grade Reliability**: Built-in exponential backoff retry mechanisms for Gemini API rate limits, stringent anti-hallucination prompting, and comprehensive TypeScript typings.

## Architecture

This application is built natively in Next.js without requiring an external python backend.

1. **Frontend**: Next.js App Router, React, TailwindCSS, Shadcn UI, and `react-pdf` for browser-based rendering.
2. **Document Pipeline**: 
   - `pdf-parse` extracts raw text from PDF buffers.
   - `chunking.ts` splits text by paragraphs while perfectly preserving `pageNumber` boundaries.
   - `@google/genai` creates high-dimensional vector embeddings of the chunks using `gemini-embedding-2`.
3. **Vector Database**: For simplicity in this implementation, chunks and their embeddings are stored in a local `.data` JSON file, with custom cosine similarity search logic in `lib/retrieval/vector-store.ts`.

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Local Development

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *Note: This key remains strictly on the server-side API routes and is never exposed to the client browser.*

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Instructions

This application is designed to be easily hosted on platforms like Vercel.

1. Connect your repository to Vercel.
2. Add the `GEMINI_API_KEY` to your Vercel Environment Variables.
3. Deploy!

*Note: Since this application uses local disk storage (`.data/`) for PDFs and vector stores, data will not persist across serverless function invocations on Vercel. For a true production deployment, swap out the `lib/storage.ts` logic to use an S3 bucket (like AWS or Supabase) and `lib/retrieval/vector-store.ts` to use a managed vector database (like Pinecone, Qdrant, or Postgres pgvector).*

## Code Structure

- `app/api/`: Next.js serverless routes for uploading, processing, and chatting.
- `components/`: React components (Upload, Chat, Tools, PDF Viewer).
- `lib/gemini/`: Intercepts and wraps `@google/genai` calls with retry logic and grounded prompts.
- `lib/pdf/`: Wraps `pdf-parse` to extract clean text while retaining page numbers.
- `lib/retrieval/`: The entire RAG pipeline (Chunking, Embedding, Vector Store, and Similarity Search).
