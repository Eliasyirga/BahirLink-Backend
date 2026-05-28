const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const upload = require("../middleware/upload"); 
const { verifyToken } = require("../middleware/auth"); 


router.post(
  "/create/:userId",
  upload.single("media"),
  serviceController.create,
);

router.put("/:id", serviceController.update);
router.get("/all", serviceController.getAll);
router.get("/user/:userId", serviceController.getByUser);
router.delete("/:id", serviceController.delete);
router.get("/agency/:agencyId", serviceController.getServicesByAgency);
router.get(
  "/responder-team/:id",
  verifyToken,
  serviceController.getResponderTeamServices,
);

module.exports = router;
