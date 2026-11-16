const {
  translateBilingual,
  isConfigured,
  MAX_TEXT_LENGTH,
} = require("../services/translationService");

/**
 * POST /api/translation/gemini   (public, rate-limited)
 * Body: { text, sourceLanguage?, targetLanguage?, model? }
 *   - `model` is ignored (the server picks the model — cost control)
 *   - `targetLanguage` is ignored (both en and am are always returned)
 * 200: { en, am, originalLanguage }
 * 400 bad text · 503 not configured · 502 upstream failure/timeout
 */
const translateGemini = async (req, res) => {
  if (!isConfigured()) {
    return res
      .status(503)
      .json({ success: false, message: "Translation is not configured" });
  }

  const { text, sourceLanguage } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "text is required and must be a non-empty string" });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `text must be at most ${MAX_TEXT_LENGTH} characters`,
    });
  }

  try {
    const result = await translateBilingual(text.trim(), {
      sourceLanguage: typeof sourceLanguage === "string" ? sourceLanguage.slice(0, 16) : undefined,
    });
    return res.status(200).json({
      en: result.en,
      am: result.am,
      originalLanguage: result.originalLanguage,
    });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 502;
    return res.status(status).json({
      success: false,
      message: (err && err.statusCode && err.message) || "Translation failed",
    });
  }
};

module.exports = { translateGemini };
