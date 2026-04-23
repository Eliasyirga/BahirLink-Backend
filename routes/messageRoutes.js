const express = require("express");
const router = express.Router();

const {
  createMessageHndler,
  getMessagesByChatHandler,
  updateMessageHandler,
  deleteMessageHandler,
} = require("../controllers/messageController");

// ======================
// ✅ CREATE MESSAGE
// POST /api/messages
// ======================
router.post("/", createMessageHndler);

// ======================
// 📥 GET MESSAGES BY CHAT
// GET /api/messages/chats/:chatId/messages
// ======================
router.get("/chats/:chatId/messages", getMessagesByChatHandler);

// ======================
// ✏️ UPDATE MESSAGE
// PUT /api/messages/:id
// ======================
router.put("/:id", updateMessageHandler);

// ======================
// ❌ DELETE MESSAGE
// DELETE /api/messages/:id
// ======================
router.delete("/:id", deleteMessageHandler);

module.exports = router;
