"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Loader2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getDocumentLocally } from "@/lib/client/storage";
import { findSimilarChunks } from "@/lib/client/retrieve";
import { DocumentChunk } from "@/types/retrieval";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: number[];
}

interface ChatInterfaceProps {
  documentId: string;
}

const SUGGESTED_QUESTIONS = [
  "Summarize this PDF",
  "What is this document about?",
  "Give me the key points",
  "Explain this like I'm 12",
  "What are the most important concepts?",
  "Quiz me on this document"
];

export function ChatInterface({ documentId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`chat-history-${documentId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          console.error("Failed to parse chat history");
        }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save chat history on update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat-history-${documentId}`, JSON.stringify(messages));
    } else {
      localStorage.removeItem(`chat-history-${documentId}`);
    }
    
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, documentId]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 1. Get local document data for similarity search
      const localData = await getDocumentLocally(documentId);
      let relevantChunks: DocumentChunk[] = [];

      if (localData && localData.chunks && localData.chunks.length > 0) {
        // 2. Get embedding for the user's query
        const embedRes = await fetch("/api/process/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunks: [{ text: text.trim() }] }),
        });

        if (embedRes.ok) {
          const { embeddedChunks } = await embedRes.json();
          const queryEmbedding = embeddedChunks[0]?.embedding;
          
          if (queryEmbedding) {
            // 3. Find most similar chunks locally
            relevantChunks = findSimilarChunks(queryEmbedding, localData.chunks, 4);
          }
        }
      }

      // 4. Send query + relevant chunks to chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text.trim(),
          relevantChunks
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const navigateToPage = (page: number) => {
    window.dispatchEvent(
      new CustomEvent("pdf-navigate", { detail: { page } })
    );
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="bg-primary/10 p-1.5 rounded-md text-primary">
            ✨
          </span>
          AI Assistant
        </h2>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-muted-foreground hover:text-destructive p-2 rounded-md transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-3xl shadow-sm">
              🤖
            </div>
            <div className="space-y-2 max-w-[280px]">
              <h3 className="font-semibold text-lg">How can I help?</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions, request summaries, or extract specific data from your document.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-4">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-sm px-4 py-2.5 bg-muted/50 hover:bg-muted text-left rounded-lg transition-colors border border-transparent hover:border-border truncate"
                >
                  &quot;{q}&quot;
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm text-foreground prose prose-sm dark:prose-invert"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>

                {/* Sources */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 ml-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Sources
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((page) => (
                        <button
                          key={page}
                          onClick={() => navigateToPage(page)}
                          className="text-[11px] px-2 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors border shadow-sm"
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <div className="relative flex items-end overflow-hidden bg-muted/50 focus-within:bg-background border rounded-2xl transition-colors shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this document..."
            className="w-full max-h-32 min-h-[52px] resize-none bg-transparent p-3.5 pr-12 focus:outline-none text-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">
            AI can make mistakes. Verify important information with the document.
          </p>
        </div>
      </div>
    </div>
  );
}
