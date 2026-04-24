const Message = require("../models/Message");

/**
 * ✅ Create message
 */
const createMessage = async (data) => {
  const { chatId, senderId, senderRole, message, type, attachmentUrl } = data;

  if (!chatId || !message || !senderRole) {
    throw new Error("chatId, message, and senderRole are required");
  }

  return await Message.create({
    chatId,
    senderId,
    senderRole,
    message,
    type: type || "text",
    attachmentUrl: attachmentUrl || null,
  });
};

/**
 * 📥 Get messages by chatId
 */
const getMessagesByChat = async (chatId) => {
  if (!chatId) {
    throw new Error("chatId is required");
  }

  return await Message.findAll({
    where: { chatId },
    order: [["createdAt", "ASC"]],
  });
};

/**
 * ✏️ Update message
 */
const updateMessage = async (messageId, data) => {
  if (!messageId) {
    throw new Error("messageId is required");
  }

  const message = await Message.findByPk(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  return await message.update({
    message: data.message ?? message.message,
    attachmentUrl: data.attachmentUrl ?? message.attachmentUrl,
    type: data.type ?? message.type,
  });
};

/**
 * ❌ Delete message
 */
const deleteMessage = async (messageId) => {
  if (!messageId) {
    throw new Error("messageId is required");
  }

  const message = await Message.findByPk(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  await message.destroy();

  return { message: "Message deleted successfully" };
};

module.exports = {
  createMessage,
  getMessagesByChat,
  updateMessage,
  deleteMessage,
};