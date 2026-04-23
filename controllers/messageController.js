const MessageService = require("../services/messageService");

/**
 * ✅ Create a message
 * POST /messages
 */
const createMessageHndler = async (req, res) => {
  try {
    const { chatId, message, type, attachmentUrl } = req.body;

    const newMessage = await MessageService.createMessage({
      chatId,
      senderId: req.user.id, // from auth middleware
      senderRole: req.user.role,
      message,
      type,
      attachmentUrl,
    });

    return res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 📥 Get all messages in a chat
 * GET /chats/:chatId/messages
 */
const getMessagesByChatHandler = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await MessageService.getMessagesByChat(chatId);

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ✏️ Update a message
 * PUT /messages/:id
 */
const updateMessageHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedMessage = await MessageService.updateMessage(id, req.body);

    return res.status(200).json({
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ❌ Delete a message
 * DELETE /messages/:id
 */
const deleteMessageHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await MessageService.deleteMessage(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createMessageHndler,
  getMessagesByChatHandler,
  updateMessageHandler,
  deleteMessageHandler,
};
