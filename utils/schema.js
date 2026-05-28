const { z } = require("zod");

const phoneRegex = /^(\+251|251|0)[79]\d{8}$/;

const localizedTextSchema = z.object({
  en: z
    .string({ required_error: "English translation is required" })
    .min(2, "English text must be a valid string"),
  am: z
    .string({ required_error: "Amharic translation is required" })
    .min(2, "Amharic text must be a valid string"),
});

const registerSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long"),
      email: z.string().email("Invalid email format"),
      phoneNumber: z
        .string()
        .regex(
          phoneRegex,
          "Invalid Ethiopian phone number. Use formats like 09xxxxxxxx, 07xxxxxxxx, or +2519xxxxxxxx",
        ),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),

      subdivision: localizedTextSchema,

      description: localizedTextSchema.nullable().optional(),
    })
    .passthrough(),
});

module.exports = { registerSchema };
