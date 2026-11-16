/**
 * Bilingual (English/Amharic) translation via Google's Gemini REST API
 * (models/{model}:generateContent), using Node's global fetch.
 *
 * translateBilingual(text) → { en, am, originalLanguage }
 *   - both en and am are non-empty
 *   - the side matching the detected language is the original text
 */

const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 15000;
const CACHE_MAX = 500;
const MAX_TEXT_LENGTH = 2000;

class TranslationError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Model comes from the server environment only — never from the client.
const resolveModel = () => {
  const m = (process.env.GEMINI_MODEL || "").trim();
  return /^[A-Za-z0-9._-]+$/.test(m) ? m : DEFAULT_MODEL;
};

// ── Tiny LRU cache (Map keeps insertion order) ─────────────────────────────
const cache = new Map();
const cacheGet = (key) => {
  if (!cache.has(key)) return undefined;
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value); // mark as most recently used
  return value;
};
const cacheSet = (key, value) => {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
};

const SYSTEM_PROMPT = [
  "You are a translation engine for an emergency-reporting app in Ethiopia.",
  "Detect the language of the user's text and return ONLY a JSON object:",
  '{"originalLanguage": "<ISO 639-1 code, e.g. en or am>", "en": "<English>", "am": "<Amharic in Ge\'ez script>"}',
  "If the text is English, en must be the text unchanged. If it is Amharic, am must be the text unchanged.",
  "Otherwise translate it into both. Translate faithfully; do not add commentary.",
  "Keep names, numbers, phone numbers and URLs unchanged.",
].join(" ");

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    originalLanguage: { type: "STRING" },
    en: { type: "STRING" },
    am: { type: "STRING" },
  },
  required: ["originalLanguage", "en", "am"],
};

// Defensive JSON extraction: tolerate code fences or surrounding prose.
const parseModelJson = (raw) => {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (_) {
      return null;
    }
  }
};

const normalizeLang = (v) => {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  const code = s.split(/[-_\s]/)[0];
  if (code === "english") return "en";
  if (code === "amharic") return "am";
  return /^[a-z]{2,3}$/.test(code) ? code : "";
};

// Fallback detector if the model omits the language: Ge'ez script → Amharic.
const looksAmharic = (text) => /[ሀ-፿]/.test(text);

const callGemini = async (text, sourceHint) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = resolveModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const userText = sourceHint
    ? `Source language hint: ${sourceHint}\n\nText:\n${text}`
    : `Text:\n${text}`;

  let res;
  try {
    res = await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey, // header, so the key never appears in URLs/logs
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err && err.name === "AbortError" ? "Translation service timed out" : "Translation service unreachable";
    console.error(`❌ Gemini request failed: ${err && err.name === "AbortError" ? "timeout" : err && err.message}`);
    throw new TranslationError(msg, 502);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body && body.error && body.error.message ? body.error.message : "";
    } catch (_) {}
    console.error(`❌ Gemini HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
    throw new TranslationError("Translation service error", 502);
  }

  let payload;
  try {
    payload = await res.json();
  } catch (_) {
    throw new TranslationError("Invalid response from translation service", 502);
  }

  const parts =
    payload && payload.candidates && payload.candidates[0] &&
    payload.candidates[0].content && payload.candidates[0].content.parts;
  const rawText = Array.isArray(parts)
    ? parts.map((p) => (p && typeof p.text === "string" ? p.text : "")).join("")
    : "";
  const parsed = parseModelJson(rawText);
  if (!parsed || typeof parsed !== "object") {
    console.error("❌ Gemini returned unparseable output");
    throw new TranslationError("Invalid response from translation service", 502);
  }
  return parsed;
};

/**
 * @param {string} text  already validated (non-empty, ≤ MAX_TEXT_LENGTH)
 * @param {{ sourceLanguage?: string }} [opts]
 */
const translateBilingual = async (text, opts = {}) => {
  const cached = cacheGet(text);
  if (cached) return cached;

  const hint = normalizeLang(opts.sourceLanguage);
  const parsed = await callGemini(text, hint && hint !== "auto" ? hint : "");

  let originalLanguage = normalizeLang(parsed.originalLanguage) || (looksAmharic(text) ? "am" : "en");
  let en = typeof parsed.en === "string" ? parsed.en.trim() : "";
  let am = typeof parsed.am === "string" ? parsed.am.trim() : "";

  // The original side is always the caller's text verbatim.
  if (originalLanguage === "en") en = text;
  if (originalLanguage === "am") am = text;

  if (!en || !am) {
    console.error("❌ Gemini response missing en/am");
    throw new TranslationError("Invalid response from translation service", 502);
  }

  const result = { en, am, originalLanguage };
  cacheSet(text, result);
  return result;
};

const isConfigured = () => Boolean(process.env.GEMINI_API_KEY);

module.exports = {
  translateBilingual,
  isConfigured,
  TranslationError,
  MAX_TEXT_LENGTH,
  DEFAULT_MODEL,
  _cache: cache, // for tests
};
