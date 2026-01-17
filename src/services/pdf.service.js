import fs from "fs";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

export async function extractPdfPages(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    pages.push({
      pageNumber,
      items: content.items
        .map((i) => ({
          text: (i.str || "").trim(),
          x: i.transform[4],
          y: i.transform[5],
          w: i.width || 0,
          h: i.height || 0,
        }))
        .filter((x) => x.text.length > 0),
    });
  }

  return { pageCount: pdf.numPages, pages };
}