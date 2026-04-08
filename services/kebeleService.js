const Kebele = require("../models/Kebele");
const ResponderTeam = require("../models/ResponderTeam");

const createKebele = async (data) => {
  const { name, description } = data;

  if (!name) throw new Error("Kebele name is required");

  const kebele = await Kebele.create({
    name,
    description: description || null,
  });

  return kebele;
};

const updateKebele = async (id, data) => {
  const kebele = await Kebele.findByPk(id);
  if (!kebele) throw new Error("Kebele not found");

  const { name, description } = data;

  await kebele.update({
    name: name || kebele.name,
    description: description !== undefined ? description : kebele.description,
  });

  return kebele;
};

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

const getKebelesByResponderTeam = async (responderTeamId) => {
  if (!responderTeamId) throw new Error("Responder Team ID is required");

  const responderTeam = await ResponderTeam.findByPk(responderTeamId, {
    include: {
      model: Kebele,
      as: "kebeles", // match your association alias
      through: { attributes: [] }, // hide join table columns
    },
  });

  if (!responderTeam) throw new Error("Responder Team not found");

  return responderTeam.kebeles; // lowercase 'kebeles'
};

module.exports = {
  createKebele,
  updateKebele,
  deleteKebele,
  getAllKebeles,
  getKebelesByResponderTeam,
};
