"use client";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ReportViewer({ url }: { url: string }) {
  return (
    <div className="overflow-auto rounded-xl border bg-white p-2">
      <Document file={url} loading={<p>Caricamento PDF...</p>}>
        <Page pageNumber={1} width={760} />
      </Document>
    </div>
  );
}
