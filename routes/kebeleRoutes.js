const express = require("express");
const router = express.Router();

const {
  createKebeleHandler,
  updateKebeleHandler,
  deleteKebeleHandler,
} = require("../controllers/kebeleController");

// Create a new kebele
router.post("/", createKebeleHandler);

// Update an existing kebele
router.put("/:id", updateKebeleHandler);

// Delete a kebele
router.delete("/:id", deleteKebeleHandler);

module.exports = router;