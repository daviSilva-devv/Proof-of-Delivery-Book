import test from "node:test";
import assert from "node:assert/strict";
import { extractDocumentNumbers } from "../lib/ocr/parser.mjs";

const range = { min: 470000, max: 480000 };

test("extracts a labeled NF number", () => {
  assert.deepEqual(extractDocumentNumbers("NF: 471.466", range), [471466]);
});

test("extracts multiple document numbers from one OCR page", () => {
  assert.deepEqual(extractDocumentNumbers("NF 471460 CANHOTO 471461", range), [471460, 471461]);
});

test("deduplicates repeated OCR hits", () => {
  assert.deepEqual(extractDocumentNumbers("471470 NF 471470 recibo 471470", range), [471470]);
});

test("filters unrelated numeric noise outside the active book range", () => {
  assert.deepEqual(extractDocumentNumbers("CNPJ 12345678000190 NF 471480 CEP 04689005", range), [471480]);
});
