const Kebele = require("../models/Kebele");
const ResponderTeam = require("../models/ResponderTeam");

/**
 * Create a Kebele
 * data: { name, description?, responderTeamId? }
 */
const createKebele = async (data) => {
  const { name, description, responderTeamId } = data;

  if (!name) throw new Error("Kebele name is required");

  const kebele = await Kebele.create({
    name,
    description: description || null,
    responderTeamId: responderTeamId || null,
  });

  return kebele;
};

/**
 * Update a Kebele
 * data: { name?, description?, responderTeamId? }
 */
const updateKebele = async (id, data) => {
  const kebele = await Kebele.findByPk(id);
  if (!kebele) throw new Error("Kebele not found");

  const { name, description, responderTeamId } = data;

  await kebele.update({
    name: name || kebele.name,
    description: description !== undefined ? description : kebele.description,
    responderTeamId:
      responderTeamId !== undefined ? responderTeamId : kebele.responderTeamId,
  });

  return kebele;
};

/**
 * Delete a Kebele
 */
const deleteKebele = async (id) => {
  const kebele = await Kebele.findByPk(id);
  if (!kebele) throw new Error("Kebele not found");

  await kebele.destroy();
  return { message: "Kebele deleted successfully" };
};
const getAllKebeles = async () => {
  const kebeles = await Kebele.findAll({
    order: [["createdAt", "DESC"]], // newest first
  });

  return kebeles;
};

/**
 * Get all kebeles (optionally include their responder team)
 */

/**
 * Get kebeles by Responder Team
 */
const getKebelesByResponderTeam = async (responderTeamId) => {
  if (!responderTeamId) throw new Error("Responder Team ID is required");

  const kebeles = await Kebele.findAll({
    where: { responderTeamId },
    order: [["createdAt", "DESC"]],
  });

  return kebeles;
};

module.exports = {
  createKebele,
  updateKebele,
  deleteKebele,
  getAllKebeles,
  getKebelesByResponderTeam,
};
