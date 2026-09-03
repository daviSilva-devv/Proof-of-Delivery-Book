import test from "node:test";
import assert from "node:assert/strict";
import { pdfRenderArgs, tesseractArgs } from "../lib/native-tools.mjs";

test("pdftoppm contract renders PNG pages at a fixed OCR resolution", () => {
  assert.deepEqual(pdfRenderArgs("batch.pdf", "runtime/page"), ["-png", "-r", "200", "batch.pdf", "runtime/page"]);
});

test("tesseract contract reads Portuguese text from one rendered page", () => {
  assert.deepEqual(tesseractArgs("runtime/page-1.png"), ["runtime/page-1.png", "stdout", "-l", "por", "--psm", "6"]);
});
