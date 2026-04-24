const express = require("express");
const router = express.Router();

const {
  createChat,
  getChatById,
  getAllChats,
  getChatByEmergency,
  getChatByService,
  updateChatStatus,
  deleteChat,
} = require("../controllers/chatController");


router.post("/", createChat);

router.get("/", getAllChats);


router.get("/:id", getChatById);

router.get("/emergency/:emergencyId", getChatByEmergency);


router.get("/service/:serviceId", getChatByService);


router.patch("/:id/status", updateChatStatus);


router.delete("/:id", deleteChat);

module.exports = router;
