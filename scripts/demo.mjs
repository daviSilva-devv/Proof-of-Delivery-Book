import { readFile } from "node:fs/promises";
import { ReceiptDatabase } from "../lib/server/db.mjs";
import { processOcrPages } from "../lib/processor.mjs";

const pages = JSON.parse(
  await readFile(new URL("../examples/synthetic-ocr-pages.json", import.meta.url), "utf8")
);

const db = new ReceiptDatabase(":memory:");

try {
  const user = db.ensureUser("portfolio-demo");
  const book = db.createBook(471460, 471465, user);
  const uploadId = db.createUpload(book.id, "synthetic-demo.pdf");
  const result = processOcrPages({ db, bookId: book.id, uploadId, pages });
  const rows = db.listFound(book.id);
  const review = rows.filter((row) => row.status === "REVIEW");

  console.log("DIGITAL RECEIPT BOOK / SYNTHETIC DEMO");
  console.log(`book: ${book.start_number}-${book.end_number}`);
  console.log(`pages processed: ${result.pages}`);
  console.log(`unique documents: ${result.uniqueDocuments}`);
  console.log(`found: ${rows.map((row) => row.document_number).join(", ")}`);
  console.log(`review: ${review.length ? review.map((row) => row.document_number).join(", ") : "none"}`);
  console.log(`pending: ${result.pending.join(", ")}`);
} finally {
  db.close();
}
