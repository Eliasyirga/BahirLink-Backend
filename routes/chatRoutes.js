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

// ======================
// ✅ CREATE CHAT
// POST /api/chats
// ======================
router.post("/", createChat);

// ======================
// 📥 GET ALL CHATS
// GET /api/chats
// ======================
router.get("/", getAllChats);

// ======================
// 📥 GET CHAT BY ID
// GET /api/chats/:id
// ======================
router.get("/:id", getChatById);

// ======================
// 📥 GET CHAT BY EMERGENCY
// GET /api/chats/emergency/:emergencyId
// ======================
router.get("/emergency/:emergencyId", getChatByEmergency);

// ======================
// 📥 GET CHAT BY SERVICE
// GET /api/chats/service/:serviceId
// ======================
router.get("/service/:serviceId", getChatByService);

// ======================
// ✏️ UPDATE CHAT STATUS
// PATCH /api/chats/:id/status
// ======================
router.patch("/:id/status", updateChatStatus);

// ======================
// ❌ DELETE CHAT
// DELETE /api/chats/:id
// ======================
router.delete("/:id", deleteChat);

module.exports = router;
