const validator = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      errors: result.error.errors.map((err) => ({
        field: err.path.join(".").replace("body.", ""),
        message: err.message,
      })),
    });
  }

  req.validated = result.data;
  next();
};

module.exports = validator;
