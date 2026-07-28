import { PdfViewerClient } from "@/components/reader/PdfViewerClient";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ToolsPanel } from "@/components/tools/ToolsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDocumentPath } from "@/lib/storage";
import { notFound } from "next/navigation";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Verify document exists
  const path = await getDocumentPath(id);
  if (!path) {
    notFound();
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
      {/* Left side: PDF Viewer */}
      <section className="flex-1 lg:w-2/3 h-[50vh] lg:h-full relative overflow-hidden">
        <PdfViewerClient documentId={id} />
      </section>

      {/* Right side: AI Assistant & Tools */}
      <section className="flex-1 lg:w-1/3 h-[50vh] lg:h-full bg-muted/10 border-t lg:border-t-0 flex flex-col overflow-hidden">
        <Tabs defaultValue="chat" className="flex flex-col h-full w-full">
          <div className="px-4 pt-3 pb-0 border-b bg-card flex justify-center">
            <TabsList className="grid w-[240px] grid-cols-2 mb-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="chat" className="flex-1 m-0 h-[calc(100%-60px)] data-[state=active]:flex flex-col">
            <ChatInterface documentId={id} />
          </TabsContent>
          <TabsContent value="tools" className="flex-1 m-0 h-[calc(100%-60px)] data-[state=active]:flex flex-col overflow-hidden">
            <ToolsPanel documentId={id} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
