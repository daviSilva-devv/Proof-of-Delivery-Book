const LABELED_NUMBER = /\b(?:NF(?:-?E)?|NOTA(?:\s+FISCAL)?|CANHOTO|RECIBO)\s*(?:N[ºO.]?\s*)?[:#-]?\s*([0-9][0-9.\/-]{3,16})\b/giu;
const GENERIC_NUMBER = /(?<!\d)(\d{5,9})(?!\d)/g;

function digits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function asSafeInteger(value) {
  const normalized = digits(value);
  if (!normalized || normalized.length > 15) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function extractDocumentNumbers(text, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const source = String(text ?? "");
  const found = new Set();

  for (const match of source.matchAll(LABELED_NUMBER)) {
    const value = asSafeInteger(match[1]);
    if (value !== null && value >= min && value <= max) found.add(value);
  }

  for (const match of source.matchAll(GENERIC_NUMBER)) {
    const value = asSafeInteger(match[1]);
    if (value !== null && value >= min && value <= max) found.add(value);
  }

  return [...found].sort((a, b) => a - b);
}

export function parseOcrPage({ pageNumber, text }, range) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) throw new TypeError("pageNumber must be a positive integer");
  return {
    pageNumber,
    numbers: extractDocumentNumbers(text, range),
    text: String(text ?? ""),
  };
}
