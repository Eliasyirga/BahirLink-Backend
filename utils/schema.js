const { z } = require("zod");

// Ethiopian numbers: optional +251 / 251 / 0 prefix followed by the 9-digit
// national number (mobile 9xxxxxxxx / 7xxxxxxxx and landlines such as
// 58xxxxxxx). The app strips non-digits before sending.
const phoneRegex = /^(\+?251|0)?[1-9]\d{8}$/;

// "" / null / undefined → null, everything else → trimmed string
const emptyToNull = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

// Required positive integer id; accepts numbers or numeric strings (multipart).
const requiredId = (name) =>
  z.coerce
    .number({ error: `${name} must be a number` })
    .int(`${name} must be an integer`)
    .positive(`${name} is required`);

const optionalId = (name) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.coerce.number().int(`${name} must be an integer`).positive().nullable(),
  );

const localizedText = z.union([
  z.string().max(5000, "description is too long"),
  z
    .object({
      en: z.string().max(5000).optional(),
      am: z.string().max(5000).optional(),
    })
    .loose(),
]);

/**
 * POST /api/caseReports — sighting submitted from the citizen app
 * (lib/services/case_report_service.dart, JSON body):
 *   { caseId, caseTypeId, kebeleId, spottedAt (ISO string), description,
 *     phoneNumber (digits, may be ""), reporterId (null) }
 */
const caseReportCreateSchema = z.object({
  body: z
    .object({
      caseId: requiredId("caseId"),
      caseTypeId: requiredId("caseTypeId"),
      kebeleId: requiredId("kebeleId"),
      spottedAt: z
        .union([z.string(), z.number(), z.date()], {
          error: "spottedAt is required",
        })
        .refine(
          (v) => !Number.isNaN(new Date(v).getTime()),
          "spottedAt must be a valid date",
        ),
      description: localizedText.nullable().optional(),
      phoneNumber: z.preprocess(
        emptyToNull,
        z
          .string()
          .regex(
            phoneRegex,
            "Invalid Ethiopian phone number. Use formats like 09xxxxxxxx, 07xxxxxxxx, or 2519xxxxxxxx",
          )
          .nullable(),
      ),
      reporterId: optionalId("reporterId"),
    })
    .loose(),
});

module.exports = { caseReportCreateSchema, phoneRegex };
