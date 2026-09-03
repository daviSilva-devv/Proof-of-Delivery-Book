# Engineering decisions

Short decision records for the public reconstruction.

## DR-001 — Document number is the primary identity

**Decision:** model lookup around the receipt/invoice number, not PDF page position.

**Why:** operators ask for a business document number. Page position is only evidence about where it was found and can change when files are re-scanned or reassembled.

**Consequence:** `receipts` has a unique `(book_id, document_number)` identity while `page_number` remains metadata.

---

## DR-002 — Book ranges cannot overlap

**Decision:** each receipt book owns one non-overlapping inclusive numeric range.

**Why:** allowing two books to claim the same number makes lookup ambiguous before OCR even runs.

**Consequence:** `createBook()` checks overlap and rejects conflicting ranges.

---

## DR-003 — Pending numbers are derived

**Decision:** do not persist one `PENDING` row for every expected document.

**Why:** absence is naturally represented by `book range - indexed receipts`. Deriving it keeps the data model smaller and avoids synchronization work when a receipt is found.

**Consequence:** `listPending()` calculates the current missing set from the active range.

---

## DR-004 — Duplicate OCR evidence requires review

**Decision:** repeated evidence for the same number in one batch is surfaced as `REVIEW`.

**Why:** OCR can repeat headers, read the same receipt twice or confuse nearby numbers. Silent deduplication would hide evidence that may matter operationally.

**Consequence:** the processor tracks batch-local duplicates and updates the canonical receipt row to `REVIEW`.

---

## DR-005 — SQLite over a service database

**Decision:** keep the public core local-first with SQLite.

**Why:** the workflow is lookup-heavy, portable and does not need network infrastructure to demonstrate the document-indexing problem.

**Consequence:** one file can hold the index, WAL provides robust local writes, and tests can use `:memory:` databases.

---

## DR-006 — OCR binaries stay outside the application

**Decision:** treat Poppler and Tesseract as explicit external tools.

**Why:** their installation paths differ across Windows/Linux environments and bundling platform binaries would add noise to a portfolio-safe core.

**Consequence:** command contracts are tested separately and `preflight` validates availability before native processing.
