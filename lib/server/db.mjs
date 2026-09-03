import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

function nowIso() {
  return new Date().toISOString();
}

export class ReceiptDatabase {
  constructor(file = "runtime/receipt-book.db") {
    this.path = file === ":memory:" ? file : resolve(file);
    if (this.path !== ":memory:") mkdirSync(dirname(this.path), { recursive: true });
    this.db = new DatabaseSync(this.path);
    this.db.exec("PRAGMA foreign_keys = ON");
    this.db.exec("PRAGMA journal_mode = WAL");
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY,
        start_number INTEGER NOT NULL,
        end_number INTEGER NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL,
        CHECK (start_number <= end_number)
      ) STRICT;

      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id),
        file_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id),
        document_number INTEGER NOT NULL,
        upload_id INTEGER REFERENCES uploads(id),
        page_number INTEGER,
        status TEXT NOT NULL CHECK (status IN ('FOUND','REVIEW')),
        source_excerpt TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (book_id, document_number)
      ) STRICT;

      CREATE INDEX IF NOT EXISTS idx_receipts_book_number
        ON receipts(book_id, document_number);
    `);
  }

  ensureUser(username = "portfolio-admin") {
    const existing = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (existing) return existing;
    const result = this.db.prepare("INSERT OR IGNORE INTO users(username, created_at) VALUES (?, ?)").run(username, nowIso());
    if (result.changes === 0) return this.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    return this.db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  }

  createBook(startNumber, endNumber, user) {
    if (!Number.isInteger(startNumber) || !Number.isInteger(endNumber) || startNumber > endNumber) {
      throw new TypeError("invalid book range");
    }
    const overlap = this.db.prepare(`
      SELECT id, start_number, end_number FROM books
      WHERE NOT (end_number < ? OR start_number > ?)
      LIMIT 1
    `).get(startNumber, endNumber);
    if (overlap) throw new Error(`book range overlaps existing book ${overlap.id}`);

    const result = this.db.prepare(
      "INSERT INTO books(start_number, end_number, created_by, created_at) VALUES (?, ?, ?, ?)"
    ).run(startNumber, endNumber, user.id, nowIso());
    return this.getBook(Number(result.lastInsertRowid));
  }

  getBook(id) {
    return this.db.prepare("SELECT * FROM books WHERE id = ?").get(id) ?? null;
  }

  createUpload(bookId, fileName) {
    const result = this.db.prepare("INSERT INTO uploads(book_id, file_name, created_at) VALUES (?, ?, ?)")
      .run(bookId, fileName, nowIso());
    return Number(result.lastInsertRowid);
  }

  recordReceipt({ bookId, documentNumber, uploadId = null, pageNumber = null, status = "FOUND", sourceExcerpt = null }) {
    const book = this.getBook(bookId);
    if (!book) throw new Error("book not found");
    if (documentNumber < book.start_number || documentNumber > book.end_number) {
      throw new Error("document number outside book range");
    }
    const stamp = nowIso();
    this.db.prepare(`
      INSERT INTO receipts(book_id, document_number, upload_id, page_number, status, source_excerpt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(book_id, document_number) DO UPDATE SET
        upload_id = excluded.upload_id,
        page_number = excluded.page_number,
        status = excluded.status,
        source_excerpt = excluded.source_excerpt,
        updated_at = excluded.updated_at
    `).run(bookId, documentNumber, uploadId, pageNumber, status, sourceExcerpt, stamp, stamp);
    return this.db.prepare("SELECT * FROM receipts WHERE book_id = ? AND document_number = ?")
      .get(bookId, documentNumber);
  }

  listFound(bookId) {
    return this.db.prepare("SELECT * FROM receipts WHERE book_id = ? ORDER BY document_number")
      .all(bookId);
  }

  listPending(bookId, { limit = 5000 } = {}) {
    const book = this.getBook(bookId);
    if (!book) throw new Error("book not found");
    const found = new Set(this.listFound(bookId).map((row) => Number(row.document_number)));
    const pending = [];
    for (let value = book.start_number; value <= book.end_number && pending.length < limit; value += 1) {
      if (!found.has(value)) pending.push(value);
    }
    return pending;
  }

  close() {
    this.db.close();
  }
}
