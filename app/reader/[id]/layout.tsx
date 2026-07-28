import { ReactNode } from "react";

export default function ReaderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {children}
    </div>
  );
}
