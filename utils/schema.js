const { z } = require("zod");

const phoneRegex = /^(\+251|251|0)[79]\d{8}$/;

const phoneValidationSchema = z.object({
  body: z
    .object({
      phoneNumber: z
        .string({ required_error: "Phone number is required" })
        .regex(
          phoneRegex,
          "Invalid Ethiopian phone number. Use formats like 09xxxxxxxx, 07xxxxxxxx, or +2519xxxxxxxx",
        ),
    })
    .passthrough(),
});

module.exports = { phoneValidationSchema };
