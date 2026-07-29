"use client";

import { useState } from "react";
import { 
  FileText, 
  List, 
  BookOpen, 
  HelpCircle, 
  BrainCircuit, 
  Lightbulb, 
  AlignLeft,
  ArrowLeft,
  Loader2,
  Copy,
  Download,
  Check
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getDocumentLocally } from "@/lib/client/storage";
import { getToolParams, ToolType } from "@/lib/client/tools";
import { findSimilarChunks } from "@/lib/client/retrieve";
import { DocumentChunk } from "@/types/retrieval";

interface ToolDef {
  id: ToolType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresInput?: boolean;
  inputPlaceholder?: string;
  options?: string[];
}

const TOOLS: ToolDef[] = [
  { id: "summarize", name: "Summarize", description: "Generate a concise summary", icon: <AlignLeft className="w-5 h-5" /> },
  { id: "detailed_summary", name: "Detailed Summary", description: "Comprehensive sectioned explanation", icon: <FileText className="w-5 h-5" /> },
  { id: "key_points", name: "Key Points", description: "Extract the most important ideas", icon: <List className="w-5 h-5" /> },
  { id: "study_notes", name: "Study Notes", description: "Structured notes for studying", icon: <BookOpen className="w-5 h-5" /> },
  { id: "important_concepts", name: "Important Concepts", description: "Key themes to understand", icon: <Lightbulb className="w-5 h-5" /> },
  { 
    id: "explain", 
    name: "Explain", 
    description: "Explain a specific concept simply", 
    icon: <HelpCircle className="w-5 h-5" />,
    requiresInput: true,
    inputPlaceholder: "Enter a concept (e.g. Neural Networks)"
  },
  { 
    id: "quiz", 
    name: "Quiz Me", 
    description: "Generate questions based on the document", 
    icon: <BrainCircuit className="w-5 h-5" />,
    options: ["Beginner", "Intermediate", "Advanced"]
  },
];

interface ToolsPanelProps {
  documentId: string;
}

export function ToolsPanel({ documentId }: ToolsPanelProps) {
  const [activeTool, setActiveTool] = useState<ToolDef | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState("Intermediate");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunTool = async () => {
    if (!activeTool) return;
    if (activeTool.requiresInput && !inputValue.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const params: Record<string, string> = {};
      if (activeTool.id === "explain") params.concept = inputValue;
      if (activeTool.id === "quiz") params.difficulty = selectedOption;

      // 1. Get tool execution parameters (query, topK, promptInstruction)
      const { query, topK, promptInstruction } = getToolParams(activeTool.id, params);

      // 2. Get local document data
      const localData = await getDocumentLocally(documentId);
      let relevantChunks: DocumentChunk[] = [];

      if (localData && localData.chunks && localData.chunks.length > 0) {
        // 3. Get embedding for the tool's synthetic query
        const embedRes = await fetch("/api/process/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunks: [{ text: query }] }),
        });

        if (!embedRes.ok) throw new Error("Failed to generate query embedding");
        
        const { embeddedChunks } = await embedRes.json();
        const queryEmbedding = embeddedChunks[0]?.embedding;
        
        if (queryEmbedding) {
          // 4. Find most similar chunks locally
          relevantChunks = findSimilarChunks(queryEmbedding, localData.chunks, topK);
        }
      }

      // 5. Send context to server
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptInstruction, relevantChunks }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to run tool");
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result && activeTool) {
      const blob = new Blob([result], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTool.name.toLowerCase().replace(/\s+/g, "_")}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (activeTool) {
    return (
      <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <button 
            onClick={() => { setActiveTool(null); setResult(null); setError(null); }}
            className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-primary">{activeTool.icon}</span>
            {activeTool.name}
          </div>
        </div>

        {/* Configuration / Output Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {!result && !isLoading && (
            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
              <p className="text-sm text-muted-foreground">{activeTool.description}</p>
              
              {activeTool.requiresInput && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Concept</label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={activeTool.inputPlaceholder}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {activeTool.options && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <select 
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                  >
                    {activeTool.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleRunTool}
                disabled={activeTool.requiresInput && !inputValue.trim()}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                Run Tool
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Analyzing document...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save as MD
                </button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/10 p-6 rounded-xl border">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-4">
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-bold tracking-tight">AI Tools</h2>
        <p className="text-sm text-muted-foreground">Select a tool to analyze the document.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool);
              if (!tool.requiresInput && !tool.options) {
                // Instantly trigger tools that don't need configuration
                setTimeout(() => {
                  document.getElementById("hidden-run-btn")?.click();
                }, 50);
              }
            }}
            className="flex flex-col items-center justify-center text-center p-4 h-32 bg-card hover:bg-accent border hover:border-primary/50 rounded-xl transition-all gap-3 group shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
              {tool.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{tool.name}</h3>
            </div>
          </button>
        ))}
      </div>

      {/* Hidden button to auto-trigger tool execution if no config needed */}
      <button id="hidden-run-btn" onClick={handleRunTool} className="hidden" />
    </div>
  );
}
