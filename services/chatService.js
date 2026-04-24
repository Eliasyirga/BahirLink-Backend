const Chat = require("../models/Chat");

/**
 * ✅ Create chat
 */
const createChat = async (data) => {
  const { type, emergencyId, serviceId } = data;

  if (!type) throw new Error("type is required");

  // must belong to one
  if (!emergencyId && !serviceId) {
    throw new Error("Chat must belong to emergency or service");
  }

  if (emergencyId && serviceId) {
    throw new Error("Chat cannot belong to both");
  }

  // prevent duplicates
  const existing = await Chat.findOne({
    where: {
      emergencyId: emergencyId || null,
      serviceId: serviceId || null,
    },
  });

  if (existing) return existing;

  return await Chat.create({
    type,
    emergencyId: emergencyId || null,
    serviceId: serviceId || null,
  });
};

/**
 * 📥 Get chat by ID
 */
const getChatById = async (id) => {
  const chat = await Chat.findByPk(id);

  if (!chat) throw new Error("Chat not found");

  return chat;
};

/**
 * 📥 Get all chats
 */
const getAllChats = async () => {
  return await Chat.findAll({
    order: [["createdAt", "DESC"]],
  });
};

/**
 * 📥 Get chat by emergency
 */
const getChatByEmergency = async (emergencyId) => {
  return await Chat.findOne({
    where: { emergencyId },
  });
};

/**
 * 📥 Get chat by service
 */
const getChatByService = async (serviceId) => {
  return await Chat.findOne({
    where: { serviceId },
  });
};

/**
 * ✏️ Update chat status (active / closed)
 */
const updateChatStatus = async (id, status) => {
  const chat = await Chat.findByPk(id);

  if (!chat) throw new Error("Chat not found");

  return await chat.update({
    status,
  });
};

/**
 * ❌ Delete chat
 */
const deleteChat = async (id) => {
  const chat = await Chat.findByPk(id);

  if (!chat) throw new Error("Chat not found");

  await chat.destroy();

  return { message: "Chat deleted successfully" };
};

module.exports = {
  createChat,
  getChatById,
  getAllChats,
  getChatByEmergency,
  getChatByService,
  updateChatStatus,
  deleteChat,
};