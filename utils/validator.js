/**
 * Express middleware factory: validates { body, query, params } against a zod
 * schema. On failure responds 400:
 *   { success: false, message, errors: [{ path, message }] }
 * On success the parsed (coerced) body replaces req.body and the full parsed
 * result is available as req.validated.
 */

// Multipart clients sometimes send localized fields as JSON strings
// ('{"en":"...","am":"..."}'). Only replace the value when it parses to a
// plain object, so ordinary text like "123" or "true" stays a string.
const JSON_OBJECT_FIELDS = ["description", "subdivision"];

const parseJsonObjectFields = (body) => {
  for (const field of JSON_OBJECT_FIELDS) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim().startsWith("{")) continue;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body[field] = parsed;
      }
    } catch (_) {
      // not JSON — keep the raw string
    }
  }
};

const validator = (schema) => (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") parseJsonObjectFields(req.body);

    const result = schema.safeParse({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    });

    if (!result.success) {
      // zod v4 exposes validation problems as `.issues`
      const errors = result.error.issues.map((issue) => {
        const segments = issue.path.map(String);
        if (["body", "query", "params"].includes(segments[0])) segments.shift();
        return { path: segments.join("."), message: issue.message };
      });
      return res.status(400).json({
        success: false,
        message: errors[0]
          ? `Invalid request: ${errors[0].path ? `${errors[0].path} — ` : ""}${errors[0].message}`
          : "Invalid request",
        errors,
      });
    }

    req.validated = result.data;
    if (result.data && result.data.body !== undefined) req.body = result.data.body;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validator;
