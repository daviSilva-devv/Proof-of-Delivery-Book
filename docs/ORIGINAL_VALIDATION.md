# Original workflow validation

This document separates two things that should not be conflated:

1. the **original local prototype** that motivated this repository;
2. the **public reconstruction** contained in this repository.

## Original local prototype

The original workflow was previously validated locally with:

- four OCR-parser scenarios;
- SQLite/database checks;
- native PDF rendering through Poppler;
- native OCR through Tesseract;
- processor integration;
- TypeScript type checking;
- a production application build.

Those checks were performed against the internal prototype environment. The original source tree, scanned receipts, customer data and local database are not reproduced here.

## Public reconstruction

This repository independently tests the portfolio-safe core using synthetic inputs:

- labeled OCR number extraction;
- multiple numbers on one page;
- deduplication of repeated OCR hits;
- active-range noise filtering;
- idempotent demo-user creation;
- non-overlapping book ranges;
- pending-number derivation;
- end-to-end parser -> processor -> SQLite indexing;
- duplicate evidence -> `REVIEW`;
- Poppler command contract;
- Tesseract command contract.

Run:

```bash
npm test
```

The distinction is deliberate: the repository documents the real engineering problem without claiming that private/internal source has been recovered or open-sourced.
