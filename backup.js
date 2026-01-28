/**
 * Google Tag Manager dış kaynak yedekleme scripti
 *
 * - Girdi: urls.txt (tercih) veya url.txt (fallback)
 * - Çıktı: backup/{js,css,images,endpoints,others}
 *
 * Çalıştırma:
 *   node backup.js
 */

const path = require("path");
const crypto = require("crypto");
const readline = require("readline");
const { URL } = require("url");

const axios = require("axios");
const fs = require("fs-extra");

const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 25000);

const ROOT_DIR = __dirname;
const BACKUP_DIR = path.join(ROOT_DIR, "backup");
const ERROR_LOG_PATH = path.join(BACKUP_DIR, "error.log");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const DIRS = {
  js: path.join(BACKUP_DIR, "js"),
  css: path.join(BACKUP_DIR, "css"),
  images: path.join(BACKUP_DIR, "images"),
  endpoints: path.join(BACKUP_DIR, "endpoints"),
  others: path.join(BACKUP_DIR, "others"),
};

function sha1Short(input) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 10);
}

function safeSlug(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

function getExtensionFromUrl(u) {
  const ext = path.extname(u.pathname || "");
  return ext ? ext.toLowerCase() : "";
}

function classifyUrl(urlStr, u) {
  const lower = String(urlStr).toLowerCase();
  const ext = getExtensionFromUrl(u);

  if (ext === ".js") return { kind: "js", ext };
  if (ext === ".css") return { kind: "css", ext };
  if ([".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"].includes(ext))
    return { kind: "images", ext };

  // “cloudfunctions” veya uzantısız URL’ler endpoint gibi ele alınır
  if (!ext || lower.includes("cloudfunctions")) return { kind: "endpoints", ext };

  return { kind: "others", ext };
}

function extractFilename(u, fallbackExt, urlStr) {
  const last = (u.pathname || "").split("/").filter(Boolean).pop() || "";
  let name = "";
  try {
    name = decodeURIComponent(last);
  } catch {
    name = last;
  }

  // Bazı URL’ler klasörle bitiyor: /images/ gibi
  if (!name) {
    const h = sha1Short(urlStr);
    return `file_${h}${fallbackExt || ""}`;
  }

  // Güvenli karakterler
  name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

  // Uzantısı yoksa (ama statik gibi sınıflandıysa) fallback uzantıyı ekle
  if (!path.extname(name) && fallbackExt) name += fallbackExt;

  return name;
}

async function appendErrorLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await fs.ensureDir(BACKUP_DIR);
  await fs.appendFile(ERROR_LOG_PATH, line, "utf8");
}

async function ensureOutputDirs() {
  await Promise.all(Object.values(DIRS).map((d) => fs.ensureDir(d)));
}

function buildAxiosConfig() {
  return {
    timeout: TIMEOUT_MS,
    responseType: "arraybuffer",
    // 4xx/5xx için throw etme; biz status’a göre loglayacağız
    validateStatus: () => true,
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  };
}

function bufferToUtf8String(buf) {
  // axios arraybuffer -> Buffer
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf || []);
  return b.toString("utf8");
}

async function uniquePath(dir, filename, salt) {
  const full = path.join(dir, filename);
  if (!(await fs.pathExists(full))) return full;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const h = sha1Short(String(salt || filename));
  return path.join(dir, `${base}_${h}${ext}`);
}

async function handleStatic(urlStr, u, kind, ext) {
  const axiosCfg = buildAxiosConfig();
  const res = await axios.get(urlStr, axiosCfg);

  const status = res.status;
  if (status < 200 || status >= 300) {
    const msg = `[STATIC] ${status} ${urlStr}`;
    console.error(msg);
    await appendErrorLog(msg);
    return;
  }

  const dir = DIRS[kind] || DIRS.others;
  const filename = extractFilename(u, ext, urlStr);
  const outPath = await uniquePath(dir, filename, urlStr);

  const buf = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data || []);
  await fs.outputFile(outPath, buf);
  console.log(`[OK][${kind}] ${urlStr} -> ${path.relative(ROOT_DIR, outPath)}`);
}

async function handleEndpoint(urlStr, u) {
  const axiosCfg = buildAxiosConfig();
  const res = await axios.get(urlStr, axiosCfg);

  const status = res.status;
  const headers = res.headers || {};
  const contentType = String(headers["content-type"] || "").toLowerCase();

  // Endpoint’lerde hata status’larını da kaydedelim (analiz için faydalı)
  if (status < 200 || status >= 300) {
    const msg = `[ENDPOINT] ${status} ${urlStr}`;
    console.error(msg);
    await appendErrorLog(msg);
  }

  const rawText = bufferToUtf8String(res.data);

  const base =
    safeSlug(`${u.hostname}${u.pathname || ""}`) || `endpoint_${sha1Short(urlStr)}`;
  const nameBase = `${base}_response_${sha1Short(urlStr)}`;

  // JSON ise parse edip meta + body olarak .json yazalım, değilse .txt
  let outExt = "txt";
  let payloadToWrite = "";

  const looksJson =
    contentType.includes("application/json") ||
    contentType.includes("+json") ||
    rawText.trim().startsWith("{") ||
    rawText.trim().startsWith("[");

  if (looksJson) {
    try {
      const parsed = JSON.parse(rawText);
      outExt = "json";
      payloadToWrite = JSON.stringify(
        {
          meta: { url: urlStr, status, contentType, headers },
          body: parsed,
        },
        null,
        2
      );
    } catch {
      // JSON parse edilemezse txt’ye düş
      outExt = "txt";
    }
  }

  if (outExt === "txt") {
    payloadToWrite = [
      `URL: ${urlStr}`,
      `Status: ${status}`,
      `Content-Type: ${contentType || "-"}`,
      "",
      "----- BODY -----",
      rawText,
      "",
    ].join("\n");
  }

  const outPath = await uniquePath(DIRS.endpoints, `${nameBase}.${outExt}`, urlStr);
  await fs.outputFile(outPath, payloadToWrite, "utf8");
  console.log(`[OK][endpoint] ${urlStr} -> ${path.relative(ROOT_DIR, outPath)}`);
}

async function processOne(urlStr) {
  const trimmed = String(urlStr || "").trim();
  if (!trimmed) return;
  if (trimmed.startsWith("#")) return;

  let u;
  try {
    u = new URL(trimmed);
  } catch (e) {
    const msg = `[INVALID_URL] ${trimmed} (${e && e.message ? e.message : "parse error"})`;
    console.error(msg);
    await appendErrorLog(msg);
    return;
  }

  const { kind, ext } = classifyUrl(trimmed, u);

  try {
    if (kind === "endpoints") {
      await handleEndpoint(trimmed, u);
    } else if (kind === "js" || kind === "css" || kind === "images") {
      await handleStatic(trimmed, u, kind, ext);
    } else {
      // others: statik gibi indir (uzantılı olduğu varsayımıyla)
      await handleStatic(trimmed, u, "others", ext);
    }
  } catch (e) {
    const msg = `[FAILED] ${trimmed} (${e && e.message ? e.message : "unknown error"})`;
    console.error(msg);
    await appendErrorLog(msg);
  }
}

async function readUrlsFromFile(filePath) {
  const urls = [];
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const v = String(line || "").trim();
    if (!v || v.startsWith("#")) continue;
    urls.push(v);
  }
  return urls;
}

async function runWithConcurrency(items, limit, worker) {
  let idx = 0;
  const runners = Array.from({ length: Math.max(1, limit) }, () =>
    (async () => {
      while (true) {
        const i = idx++;
        if (i >= items.length) break;
        await worker(items[i], i);
      }
    })()
  );
  await Promise.all(runners);
}

async function resolveInputFile() {
  const candidates = [path.join(ROOT_DIR, "urls.txt"), path.join(ROOT_DIR, "url.txt")];
  for (const p of candidates) {
    if (await fs.pathExists(p)) return p;
  }
  return null;
}

async function main() {
  await ensureOutputDirs();

  const input = await resolveInputFile();
  if (!input) {
    throw new Error(
      "Girdi dosyası bulunamadı. Root’ta urls.txt veya url.txt olmalı."
    );
  }

  const urls = await readUrlsFromFile(input);
  console.log(`Toplam URL: ${urls.length} (kaynak: ${path.basename(input)})`);
  console.log(`Eşzamanlılık: ${CONCURRENCY}, Timeout: ${TIMEOUT_MS}ms`);

  await runWithConcurrency(urls, CONCURRENCY, async (u) => processOne(u));

  console.log("Bitti. Çıktı klasörü: backup/");
  console.log(`Hata logu (varsa): ${path.relative(ROOT_DIR, ERROR_LOG_PATH)}`);
}

main().catch(async (e) => {
  const msg = `[FATAL] ${e && e.message ? e.message : String(e)}`;
  console.error(msg);
  await appendErrorLog(msg);
  process.exitCode = 1;
});

