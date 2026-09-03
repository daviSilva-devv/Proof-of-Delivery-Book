import test from "node:test";
import assert from "node:assert/strict";
import { ReceiptDatabase } from "../lib/server/db.mjs";
import { processOcrPages } from "../lib/processor.mjs";

test("processor indexes synthetic OCR pages and keeps missing documents visible", () => {
  const db = new ReceiptDatabase(":memory:");
  const user = db.ensureUser("admin");
  const book = db.createBook(471460, 471464, user);
  const uploadId = db.createUpload(book.id, "synthetic-batch.pdf");

  const result = processOcrPages({
    db,
    bookId: book.id,
    uploadId,
    pages: [
      { pageNumber: 1, text: "ENTREGA\nNF 471460\nNF 471461" },
      { pageNumber: 2, text: "CANHOTO 471463\nCNPJ 12345678000190" },
    ],
  });

  assert.equal(result.pages, 2);
  assert.equal(result.uniqueDocuments, 3);
  assert.deepEqual(result.pending, [471462, 471464]);
  assert.deepEqual(db.listFound(book.id).map((row) => Number(row.document_number)), [471460, 471461, 471463]);
  db.close();
});

test("duplicate hits in the same batch are surfaced for review", () => {
  const db = new ReceiptDatabase(":memory:");
  const user = db.ensureUser("admin");
  const book = db.createBook(471470, 471472, user);
  const uploadId = db.createUpload(book.id, "duplicate-demo.pdf");
  const result = processOcrPages({
    db,
    bookId: book.id,
    uploadId,
    pages: [
      { pageNumber: 1, text: "NF 471470" },
      { pageNumber: 2, text: "NF 471470" },
    ],
  });
  assert.equal(result.indexed.at(-1).status, "REVIEW");
  db.close();
});
