const { rateLimit } = require("express-rate-limit");

const make = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message, error: message },
    ...extra,
  });

/**
 * Each call returns a NEW limiter (separate counter), so the web login page —
 * which tries users → agency → responder login in sequence — doesn't burn
 * through one shared budget. Only failed attempts count.
 */
const loginLimiter = () =>
  make(15 * 60 * 1000, 10, "Too many login attempts. Please try again later.", {
    skipSuccessfulRequests: true,
  });

const registerLimiter = make(
  60 * 60 * 1000,
  10,
  "Too many registration attempts. Please try again later.",
);

const verifyCodeLimiter = make(
  15 * 60 * 1000,
  10,
  "Too many verification attempts. Please try again later.",
  { skipSuccessfulRequests: true },
);

const forgotPasswordLimiter = make(
  60 * 60 * 1000,
  5,
  "Too many password reset requests. Please try again later.",
);

const refreshTokenLimiter = make(
  15 * 60 * 1000,
  30,
  "Too many token refresh requests. Please try again later.",
);

// Public Gemini translation endpoint (each call costs money).
const translationLimiter = make(
  60 * 1000,
  30,
  "Too many translation requests. Please slow down.",
);

module.exports = {
  translationLimiter,
  loginLimiter,
  registerLimiter,
  verifyCodeLimiter,
  forgotPasswordLimiter,
  refreshTokenLimiter,
};
