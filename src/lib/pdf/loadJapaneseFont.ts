import type jsPDF from "jspdf";

export const loadJapaneseFont = async (doc: jsPDF) => {
  const res = await fetch("/fonts/NotoSansJP-Regular.ttf");
  const fontBuffer = await res.arrayBuffer();

  const base64Font = btoa(
    String.fromCharCode(...new Uint8Array(fontBuffer))
  );

  doc.addFileToVFS("NotoSansJP-Regular.ttf", base64Font);
  doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
  doc.setFont("NotoSansJP");
};