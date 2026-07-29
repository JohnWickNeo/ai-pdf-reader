"use client";

import dynamic from "next/dynamic";

export const PDFUploader = dynamic(
  () => import("./PDFUploader").then((mod) => mod.PDFUploader),
  { ssr: false }
);
