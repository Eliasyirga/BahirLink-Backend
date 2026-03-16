const CrewRole = require("../models/CrewRole");

/**
 * Create a new Crew Role
 * data: { name, description }
 */
const createCrewRole = async (data) => {
  const { name, description } = data;

  if (!name) throw new Error("Role name is required");

  // Ensure unique name
  const existing = await CrewRole.findOne({ where: { name } });
  if (existing) throw new Error("Role with this name already exists");

  const role = await CrewRole.create({ name, description });
  return role;
};

/**
 * Update an existing Crew Role
 * id: role id
 * data: { name?, description? }
 */
const updateCrewRole = async (id, data) => {
  const role = await CrewRole.findByPk(id);
  if (!role) throw new Error("Crew Role not found");

  if (data.name) {
    // Check for uniqueness if name is being updated
    const existing = await CrewRole.findOne({ where: { name: data.name } });
    if (existing && existing.id !== id) throw new Error("Role with this name already exists");
  }

  await role.update(data);
  return role;
};

/**
 * Delete a Crew Role
 * id: role id
 */
const deleteCrewRole = async (id) => {
  const role = await CrewRole.findByPk(id);
  if (!role) throw new Error("Crew Role not found");

  await role.destroy();
  return { message: "Crew Role deleted successfully" };
};

module.exports = {
  createCrewRole,
  updateCrewRole,
  deleteCrewRole,
};