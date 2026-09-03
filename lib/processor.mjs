import { parseOcrPage } from "./ocr/parser.mjs";

function excerptAround(text, number, radius = 64) {
  const source = String(text ?? "");
  const token = String(number);
  const at = source.indexOf(token);
  if (at < 0) return source.slice(0, radius * 2).trim();
  return source.slice(Math.max(0, at - radius), Math.min(source.length, at + token.length + radius)).trim();
}

export function processOcrPages({ db, bookId, uploadId, pages }) {
  const book = db.getBook(bookId);
  if (!book) throw new Error("book not found");
  const seen = new Set();
  const indexed = [];

  for (const page of pages) {
    const parsed = parseOcrPage(page, { min: book.start_number, max: book.end_number });
    for (const documentNumber of parsed.numbers) {
      const duplicateInBatch = seen.has(documentNumber);
      seen.add(documentNumber);
      const row = db.recordReceipt({
        bookId,
        documentNumber,
        uploadId,
        pageNumber: parsed.pageNumber,
        status: duplicateInBatch ? "REVIEW" : "FOUND",
        sourceExcerpt: excerptAround(parsed.text, documentNumber),
      });
      indexed.push({ ...row, duplicateInBatch });
    }
  }

  return {
    pages: pages.length,
    uniqueDocuments: seen.size,
    indexed,
    pending: db.listPending(bookId),
  };
}
