"use client";

import dynamic from "next/dynamic";

export const PdfViewerClient = dynamic(
  () => import("./PdfViewerClient").then((mod) => mod.PdfViewerClient),
  { ssr: false }
);
