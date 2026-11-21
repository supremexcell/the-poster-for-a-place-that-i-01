// VELMARA — Isles of the Amber Sea: a travel poster for a place that
// does not exist. Entry for @alriaco.
// Copies the poster (entry.png, drawn entirely in code by
// work/build_poster.py — no copied art, no photos, no logos) to
// /output/entry.png, then verifies the copy byte-for-byte (SHA-256),
// failing loudly on any mismatch. Node 22, standard library only, no
// network. Deterministic: the image is a fixed file in this repository,
// so every run writes the same bytes.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.png");
copyFileSync(src, outPath);

// Byte-verify: the copy must be exactly the file in this repository.
const digest = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");
if (digest(src) !== digest(outPath)) {
  throw new Error("entry.png copy does not match the repository file");
}

// Enforce the competition's own output gates at runtime: a whole PNG of
// at most 1,048,576 bytes and 1024 by 1024 pixels.
const buf = readFileSync(outPath);
// A whole PNG starts with the 8-byte PNG signature; a truncated or
// non-PNG file must fail here rather than pass the size/dimension gates.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
  throw new Error("entry.png is not a whole PNG (bad signature)");
}
if (buf.length > 1048576) {
  throw new Error(`entry.png is ${buf.length} bytes, over the 1 MiB cap`);
}
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 cap`);
}
console.log(`wrote ${outPath} (${width}x${height}, ${buf.length} bytes, sha256 ${digest(outPath)})`);
