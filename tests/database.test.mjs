import test from "node:test";
import assert from "node:assert/strict";
import { ReceiptDatabase } from "../lib/server/db.mjs";

test("user seed is idempotent", () => {
  const db = new ReceiptDatabase(":memory:");
  const a = db.ensureUser("admin");
  const b = db.ensureUser("admin");
  assert.equal(a.id, b.id);
  db.close();
});

test("book ranges cannot overlap", () => {
  const db = new ReceiptDatabase(":memory:");
  const user = db.ensureUser("admin");
  db.createBook(475000, 475010, user);
  assert.throws(() => db.createBook(475005, 475020, user), /overlaps/i);
  db.close();
});

test("pending numbers disappear as receipts are indexed", () => {
  const db = new ReceiptDatabase(":memory:");
  const user = db.ensureUser("admin");
  const book = db.createBook(475000, 475003, user);
  db.recordReceipt({ bookId: book.id, documentNumber: 475001, pageNumber: 1 });
  db.recordReceipt({ bookId: book.id, documentNumber: 475003, pageNumber: 2 });
  assert.deepEqual(db.listPending(book.id), [475000, 475002]);
  db.close();
});
