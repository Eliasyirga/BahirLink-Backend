const { Emergency, User } = require("../models");

const Assignment = require("../models/Assignment")

async function canAccessEmergency(userId, emergencyId) {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) return false;

  const user = await User.findByPk(userId);
  if (!user) return false;


  if (user.role === "guest" && emergency.guestId === userId) return true;

  if (user.role === "admin" || user.role === "responder") return true;

  const assigned = await Assignment.findOne({
    where: { emergencyId, userId }
  });
  if (assigned) return true;

  return false; 
}

module.exports = { canAccessEmergency };
