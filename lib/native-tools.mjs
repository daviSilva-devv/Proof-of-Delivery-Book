import { access } from "node:fs/promises";
import { spawn } from "node:child_process";

export const nativeToolPaths = {
  pdftoppm: process.env.PDFTOPPM_PATH || "pdftoppm",
  tesseract: process.env.TESSERACT_PATH || "tesseract",
};

export function pdfRenderArgs(pdfPath, outputPrefix) {
  return ["-png", "-r", "200", pdfPath, outputPrefix];
}

export function tesseractArgs(imagePath, language = "por") {
  return [imagePath, "stdout", "-l", language, "--psm", "6"];
}

export async function pathLooksUsable(value) {
  if (!value.includes("/") && !value.includes("\\")) return true;
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
}

export function runCommand(command, args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}
