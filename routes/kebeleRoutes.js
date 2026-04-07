const express = require("express");
const router = express.Router();

const {
  createKebeleHandler,
  updateKebeleHandler,
  deleteKebeleHandler,
  getAllKebelesHandler,

  getKebelesByResponderTeamHandler,
} = require("../controllers/kebeleController");

// Get all Kebeles
router.get("/", getAllKebelesHandler);

// Create a new kebele
router.post("/", createKebeleHandler);

router.put("/:id", updateKebeleHandler);

router.delete("/:id", deleteKebeleHandler);

router.get("/", getAllKebelesHandler);

router.get("/team/:responderTeamId", getKebelesByResponderTeamHandler);

module.exports = router;
