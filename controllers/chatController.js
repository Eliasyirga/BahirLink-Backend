const ChatService = require("../services/chatService");

const createChat = async (req, res) => {
  try {
    const chat = await ChatService.createChat(req.body);

    return res.status(201).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await ChatService.getChatById(req.params.id);

    return res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllChats = async (req, res) => {
  try {
    const chats = await ChatService.getAllChats();

    return res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getChatByEmergency = async (req, res) => {
  try {
    const chat = await ChatService.getChatByEmergency(req.params.emergencyId);

    return res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getChatByService = async (req, res) => {
  try {
    const chat = await ChatService.getChatByService(req.params.serviceId);

    return res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateChatStatus = async (req, res) => {
  try {
    const chat = await ChatService.updateChatStatus(
      req.params.id,
      req.body.status,
    );

    return res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteChat = async (req, res) => {
  try {
    const result = await ChatService.deleteChat(req.params.id);

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
  createChat,
  getChatById,
  getAllChats,
  getChatByEmergency,
  getChatByService,
  updateChatStatus,
  deleteChat,
};
