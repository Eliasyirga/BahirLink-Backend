const Kebele = require("../models/Kebele");

/**
 * Create a new Kebele
 * data: { name, description }
 */
const createKebele = async (data) => {
  if (!data.name) throw new Error("Kebele name is required");

  const kebele = await Kebele.create({
    name: data.name,
    description: data.description || null,
  });

  return kebele;
};

/**
 * Update an existing Kebele
 * id: Kebele ID
 * data: { name?, description? }
 */
const updateKebele = async (id, data) => {
  const kebele = await Kebele.findByPk(id);
  if (!kebele) throw new Error("Kebele not found");

  await kebele.update({
    name: data.name ?? kebele.name,
    description: data.description ?? kebele.description,
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

module.exports = {
  createKebele,
  updateKebele,
  deleteKebele,
};
