const express = require("express");
const router = express.Router();

const {
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
  getAllTeamsHandler,
  getTeamsByAgencyHandler,
  responderLoginHandler,
  getTeamByIdHandler,
  getTeamsByAgencyTypeHandler,
} = require("../controllers/responderTeamController");

router.post("/", createTeamHandler);

router.post("/login", responderLoginHandler);

router.get("/type", getTeamsByAgencyTypeHandler);

router.get("/", getAllTeamsHandler);

router.get("/:id", getTeamByIdHandler);

router.get("/agency/:agencyId", getTeamsByAgencyHandler);

router.put("/:id", updateTeamHandler);

router.delete("/:id", deleteTeamHandler);

module.exports = router;
