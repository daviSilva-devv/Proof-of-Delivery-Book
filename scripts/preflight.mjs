import { nativeToolPaths, pathLooksUsable, runCommand } from "../lib/native-tools.mjs";

async function inspect(name, command, args) {
  const pathOk = await pathLooksUsable(command);
  if (!pathOk) return { name, command, ok: false, reason: "configured path does not exist" };
  try {
    const result = await runCommand(command, args);
    return { name, command, ok: true, version: result.stdout.trim() || result.stderr.trim() };
  } catch (error) {
    return { name, command, ok: false, reason: error.message };
  }
}

const results = await Promise.all([
  inspect("pdftoppm", nativeToolPaths.pdftoppm, ["-v"]),
  inspect("tesseract", nativeToolPaths.tesseract, ["--version"]),
]);

console.log(JSON.stringify(results, null, 2));
process.exitCode = results.every((item) => item.ok) ? 0 : 1;
