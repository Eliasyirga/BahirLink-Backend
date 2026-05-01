const express = require("express");
const router = express.Router();

const finalReportController = require("../controllers/finalReportController");

//
// 🧾 CREATE FINAL REPORT
// (usually triggered automatically when emergency is resolved)
//
router.post("/", finalReportController.createFinalReport);

//
// 📄 GET ALL FINAL REPORTS
//
router.get("/", finalReportController.getAll);

//
// 🔍 GET FINAL REPORT BY ID
//
router.get("/:id", finalReportController.getById);

//
// ✏️ UPDATE FINAL REPORT
//
router.put("/:id", finalReportController.update);

//
// ❌ DELETE FINAL REPORT
//
router.delete("/:id", finalReportController.remove);

module.exports = router;
