const validator = (schema) => (req, res, next) => {
  try {
    // 1. Pre-parse stringified objects sent via multipart/form-data (Multer)
    if (req.body) {
      if (typeof req.body.subdivision === "string") {
        try {
          req.body.subdivision = JSON.parse(req.body.subdivision);
        } catch (e) {}
      }
      if (typeof req.body.description === "string") {
        try {
          req.body.description = JSON.parse(req.body.description);
        } catch (e) {}
      }
    }

    // 2. Safe parse with Zod
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // 3. If validation fails, handle gracefully without crashing
    if (!result.success) {
      return res.status(400).json({
        success: false,
        status: "fail",
        errors: result.error.errors.map((err) => ({
          field: err.path.join(".").replace("body.", ""),
          message: err.message,
        })),
      });
    }

    // 4. If validation passes, attach safe data and move forward
    req.validated = result.data;
    next();
  } catch (error) {
    // Fallback to prevent 500 Internal Server Error crashes
    next(error);
  }
};

module.exports = validator;
