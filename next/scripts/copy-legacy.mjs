import { cp, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "..");
const DST = join(ROOT, "public", "legacy");

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

await mkdir(DST, { recursive: true });

const indexSrc = join(SRC, "index.html");
const assetsSrc = join(SRC, "assets");

if (!(await exists(indexSrc))) {
  console.error("[copy-legacy] source index.html not found at:", indexSrc);
  process.exit(0); // 빌드 중단하지 않음
}

await cp(indexSrc, join(DST, "index.html"));
if (await exists(assetsSrc)) {
  await cp(assetsSrc, join(DST, "assets"), { recursive: true });
}
console.log("[copy-legacy] done →", DST);
