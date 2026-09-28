// CI image step. Runs on CI's working copy of the repository BEFORE `jekyll build`, so the
// build publishes what it writes. It rewrites images in place, so outside CI (where the
// environment variable CI is "true") it refuses to run unless given --local: use it only on
// a copy of the repository. The repository keeps every file exactly as it was uploaded; it
// is public, so an upload's own metadata (such as the GPS position a phone stores in a
// photo) stays readable there. This step cleans the copies on the site, and names any
// upload that holds a GPS position in a warning on the run's summary page.
//
// 1. Upload folders people/, photos/, pubs/ (under assets/images/), JPG (also .jpeg, .jfif,
//    .jpe, .jif), PNG, WebP, AVIF:
//    a file larger than its folder's limit (longest side in pixels, or file size) is scaled
//    down to fit, never enlarged, keeping its aspect ratio, and written back when the result
//    is at least 10% smaller. Metadata (EXIF, which can hold the GPS position; XMP; IPTC;
//    PNG text chunks) is always removed: a PNG drops those chunks and keeps its pixels as
//    they are (so it never grows); any other format is re-encoded, after applying its EXIF
//    rotation. An animated image is not re-encoded (that would keep one frame).
// 2. Smaller renditions for srcset, in assets/images/thumbs/<path>-<W>w<ext>: gallery
//    photos (photos/) 480, 800 and 1200 px wide, publication thumbnails (pubs/) 480, journal
//    covers (cover-*.jpg at the assets/images/ root, not the -full copies) 400. A width is
//    made only when it is well below the image's own (at most 85% of it), from the file as
//    uploaded, and kept only when it is at least 10% smaller than the published image.
// 3. The list, written last to the data file named on the command line
//    (_data/generated_images.json): for every image in photos/ and pubs/ and every cover,
//    keyed by its path under assets/images/, its pixel size (w, h), its srcset width value
//    (d) and its renditions. _includes/image-srcset.html and _layouts/publication.html read
//    it. Without the file (a local build, or this step failed) pages use the plain image
//    files, as they did before this step existed.
//
// The srcset width value: photos/ and pubs/ images are shown with object-fit: cover in a
// 4:3 box, so a picture wider than 4:3 fills the box height and is cropped at the sides; it
// is drawn wider than the box by aspect / (4/3), and its value is its width scaled down by
// that factor, so the browser picks a file that is sharp at the size actually drawn.
// Covers are shown whole, so their value is their width.
//
// A file that cannot be processed is left as it was, with no renditions, and named in a
// warning. So is a photo in a format this step does not process (HEIC, the iPhone default,
// TIFF, DNG): its metadata stays in the published copy, and most browsers cannot show it.
//
// Usage (CI): node .github/scripts/prepare-images.mjs assets/images _data/generated_images.json
// Elsewhere, on a copy of the repository: add --local.

import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const local = args.includes("--local");
const [root, dataFile] = args.filter((a) => a !== "--local");
if (!root || !dataFile) {
  console.error("usage: node prepare-images.mjs <assets/images dir> <data file to write> [--local]");
  process.exit(2);
}
if (process.env.CI !== "true" && !local) {
  console.error("prepare-images rewrites images in place. CI runs it on its own copy; to run it yourself, use a copy of the repository and add --local.");
  process.exit(2);
}

// Step 1 limits: longest side (px) and file-size budget (bytes) per upload folder.
const LIMITS = {
  people: { side: 800, bytes: 250 * 1024 },  // portraits: shown at 180-280px
  photos: { side: 1600, bytes: 600 * 1024 }, // gallery: full-size view in the lightbox
  pubs: { side: 1200, bytes: 400 * 1024 },   // graphical abstracts: at most 320px tall on paper pages
};

// Step 2 rendition widths (px). `cover4x3`: shown with object-fit: cover in a 4:3 box.
const RENDITIONS = {
  photos: { widths: [480, 800, 1200], cover4x3: true },
  pubs: { widths: [480], cover4x3: true },
  covers: { widths: [400], cover4x3: false },
};

const THUMBS = "thumbs";
// Formats this step reads and writes, by extension. A GIF is listed (step 3) as it is.
const FORMAT = { ".jpg": "jpeg", ".jpeg": "jpeg", ".jfif": "jpeg", ".jpe": "jpeg", ".jif": "jpeg", ".png": "png", ".webp": "webp", ".avif": "avif" };
// Camera and scanner formats it does not handle; an upload in one of them gets a warning.
const UNHANDLED = new Set([".heic", ".heif", ".tif", ".tiff", ".dng"]);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

async function listFiles(dir) {
  const files = [];
  try {
    for await (const f of walk(dir)) files.push(f);
  } catch (e) {
    if (e.code !== "ENOENT") throw e; // a missing folder just means nothing to do
  }
  return files.sort();
}

// Replace a file in one step, so an interrupted run never leaves half a file behind.
async function replaceFile(file, buf) {
  const tmp = `${file}.tmp-${process.pid}`;
  await writeFile(tmp, buf);
  await rename(tmp, file);
}

const toPosix = (p) => p.split(path.sep).join("/");

// A warning annotation (GitHub shows it on the run's summary page), about one image.
function warn(rel, msg) {
  const prop = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
  const data = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  console.log(`::warning file=${prop(toPosix(path.join(root, rel)))}::${data(`${rel}: ${msg}`)}`);
}

// Pixel size as displayed, after any EXIF rotation.
function shownSize(meta) {
  const o = meta.autoOrient || meta;
  return { w: o.width, h: o.height };
}

// Does raw EXIF data hold a GPS position (a GPS block with a latitude or longitude)?
function hasGps(exif) {
  try {
    if (!exif) return false;
    let b = exif;
    if (b.toString("latin1", 0, 6) === "Exif\0\0") b = b.subarray(6);
    const order = b.toString("latin1", 0, 2);
    if (order !== "II" && order !== "MM") return false;
    const le = order === "II";
    const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
    const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
    const tags = (ifd) => Array.from({ length: u16(ifd) }, (_, i) => ifd + 2 + 12 * i);
    const gps = tags(u32(4)).find((e) => u16(e) === 0x8825); // GPSInfo pointer in IFD0
    if (gps === undefined) return false;
    return tags(u32(gps + 8)).some((e) => [1, 2, 3, 4].includes(u16(e))); // Latitude(Ref), Longitude(Ref)
  } catch {
    return false; // unreadable EXIF: it is removed from the site copy all the same
  }
}

// The PNG without its metadata chunks (eXIf; tEXt, zTXt, iTXt, which carry XMP and
// "Raw profile" EXIF/IPTC); every other chunk is kept byte for byte, so the pixels,
// transparency, colour profile and any animation are exactly as uploaded.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_METADATA = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);
function stripPng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("not a PNG file");
  const kept = [PNG_SIGNATURE];
  let o = 8;
  while (o + 12 <= buf.length) {
    const type = buf.toString("latin1", o + 4, o + 8);
    const end = o + 12 + buf.readUInt32BE(o);
    if (end > buf.length) throw new Error("truncated PNG");
    if (!PNG_METADATA.has(type)) kept.push(buf.subarray(o, end));
    o = end;
    if (type === "IEND") break;
  }
  return Buffer.concat(kept);
}

function encode(img, fmt, small, palette = false) {
  switch (fmt) {
    case "jpeg": return img.jpeg({ quality: small ? 80 : 82, mozjpeg: true });
    case "png": return small || palette
      ? img.png({ palette: true, compressionLevel: 9, effort: 10 }) // palette keeps transparency
      : img.png({ compressionLevel: 9, adaptiveFiltering: true });
    case "webp": return img.webp({ quality: small ? 80 : 82 });
    case "avif": return img.avif({ quality: small ? 50 : 60 });
    default: throw new Error(`cannot write ${fmt}`);
  }
}

const stats = { checked: 0, rewritten: 0, stripped: 0, renditions: 0, failed: 0, unhandled: 0, before: 0, after: 0 };
const list = {};
const made = new Set(); // rendition paths written in this run (lower case)

// Step 1 for one file; returns the bytes as uploaded and as published.
async function optimize(file, rel, fmt, limit) {
  const input = await readFile(file);
  stats.checked++;
  const meta = await sharp(input).metadata();
  const hasMeta = Boolean(meta.exif || meta.xmp || meta.iptc || meta.comments?.length);
  const { w, h } = shownSize(meta);
  const tooBig = Math.max(w, h) > limit.side || input.length > limit.bytes;
  if (!hasMeta && !tooBig) return { input, output: input };
  if (hasGps(meta.exif)) {
    warn(rel, "the upload holds a GPS position (where the photo was taken). The copy on the site has it removed, but the file in the repository and its history keep it; consider replacing the file with a copy without location.");
  }
  const rotated = (meta.orientation || 1) !== 1;
  const animated = (meta.pages || 1) > 1;
  // A PNG sheds its metadata chunks without re-encoding, unless a rotation must be applied.
  const base = hasMeta && fmt === "png" && !rotated ? stripPng(input) : input;
  const mustEncode = hasMeta && base === input; // metadata that only re-encoding removes
  let output = base;
  if (animated) {
    if (mustEncode) warn(rel, "an animated image with metadata is published as uploaded (re-encoding would keep one frame).");
  } else if (tooBig || mustEncode) {
    const img = sharp(input).rotate().resize({
      width: limit.side, height: limit.side, fit: "inside", withoutEnlargement: true,
    });
    const out = await encode(img, fmt, false, Boolean(meta.isPalette)).toBuffer();
    if (mustEncode || out.length <= base.length * 0.9) output = out;
  }
  if (output === input) return { input, output };
  await replaceFile(file, output);
  if (hasMeta) stats.stripped++;
  stats.rewritten++;
  stats.before += input.length;
  stats.after += output.length;
  console.log(`${rel}: ${w}x${h}, ${Math.round(input.length / 1024)} KB -> ${Math.round(output.length / 1024)} KB${hasMeta ? " (metadata removed)" : ""}`);
  return { input, output };
}

// Steps 2 and 3 for one file.
async function describe(rel, fmt, rend, input, output) {
  const meta = await sharp(output).metadata();
  const { w, h } = shownSize(meta);
  const f = rend.cover4x3 ? Math.min(1, (4 / 3) / (w / h)) : 1;
  const entry = { w, h, d: Math.round(w * f), variants: [] };
  // A space or comma would split the srcset entry; such a file keeps its plain src.
  if (fmt && (meta.pages || 1) === 1 && !/[\s,]/.test(rel)) {
    const ext = path.extname(rel); // kept as written, so x.jpg and x.jpeg get different names
    for (const W of rend.widths) {
      if (W > 0.85 * w) continue;
      const src = `${THUMBS}/${rel.slice(0, -ext.length)}-${W}w${ext}`;
      if (made.has(src.toLowerCase())) {
        warn(rel, `its ${W}px copy would be named ${src}, which another image already uses; it gets no copy at that width.`);
        continue;
      }
      const out = await encode(sharp(input).rotate().resize({ width: W }), fmt, true).toBuffer();
      if (out.length > output.length * 0.9) continue;
      const dest = path.join(root, ...src.split("/"));
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, out);
      made.add(src.toLowerCase());
      entry.variants.push({ src, d: Math.round(W * f) });
      stats.renditions++;
    }
  }
  list[rel] = entry;
}

async function processFile(file, folder, limit) {
  const rel = toPosix(path.relative(root, file));
  const ext = path.extname(file).toLowerCase();
  const fmt = FORMAT[ext];
  if (!fmt && ext !== ".gif") {
    if (UNHANDLED.has(ext)) {
      stats.unhandled++;
      warn(rel, `${ext.slice(1).toUpperCase()} is published as uploaded: not checked for a GPS position or cleaned, and most browsers cannot show it. Upload a JPG instead.`);
    }
    return;
  }
  try {
    const { input, output } = fmt && limit
      ? await optimize(file, rel, fmt, limit)
      : await readFile(file).then((b) => ({ input: b, output: b }));
    if (RENDITIONS[folder]) await describe(rel, fmt, RENDITIONS[folder], input, output);
  } catch (e) {
    stats.failed++;
    warn(rel, `could not be processed (${e.message}); it is published as uploaded, without smaller copies.`);
  }
}

for (const folder of Object.keys(LIMITS)) {
  for (const file of await listFiles(path.join(root, folder))) await processFile(file, folder, LIMITS[folder]);
}
for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (entry.isFile() && /^cover-.*\.jpe?g$/i.test(entry.name) && !/-full\.jpe?g$/i.test(entry.name)) {
    await processFile(path.join(root, entry.name), "covers", null);
  }
}

const sorted = Object.fromEntries(Object.keys(list).sort().map((k) => [k, list[k]]));
await mkdir(path.dirname(dataFile), { recursive: true });
await replaceFile(dataFile, JSON.stringify(sorted) + "\n");

console.log(
  `prepare-images: checked ${stats.checked}, rewrote ${stats.rewritten}` +
  (stats.rewritten ? ` (${Math.round(stats.before / 1024)} KB -> ${Math.round(stats.after / 1024)} KB` +
    (stats.stripped ? `, metadata removed from ${stats.stripped}` : "") + ")" : "") +
  `; ${stats.renditions} renditions for ${Object.keys(sorted).length} images listed in ${dataFile}` +
  (stats.failed ? `; ${stats.failed} left as uploaded after an error` : "") +
  (stats.unhandled ? `; ${stats.unhandled} in a format this step does not handle` : "")
);
