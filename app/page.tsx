import { PDFUploader } from "@/components/upload/PDFUploaderWrapper";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
            AI PDF Reader
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your documents and let AI help you summarize, query, and extract insights instantly.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <PDFUploader />
        </div>
        
        <div className="pt-12 text-sm text-muted-foreground text-center">
          <p>Secure, fast, and completely private.</p>
        </div>
      </div>
    </main>
  );
}
