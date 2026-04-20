const {
  createCrewRole,
  updateCrewRole,
  deleteCrewRole,
  getAllCrewRoles,
  getCrewRoleById,
} = require("../services/crewRoleService");

/**
 * Create a new Crew Role
 */
const createCrewRoleHandler = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const role = await createCrewRole({ name, description });

    res.status(201).json({
      message: "Crew Role created successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an existing Crew Role
 */
const updateCrewRoleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const role = await updateCrewRole(id, data);

    res.status(200).json({
      message: "Crew Role updated successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a Crew Role
 */
const deleteCrewRoleHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteCrewRole(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCrewRolesHandler = async (req, res) => {
  try {
    const roles = await getAllCrewRoles();

    res.status(200).json({
      message: "Crew Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getCrewRoleByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await getCrewRoleById(id);

    res.status(200).json({
      message: "Crew Role fetched successfully",
      data: role,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  createCrewRoleHandler,
  updateCrewRoleHandler,
  deleteCrewRoleHandler,
  getAllCrewRolesHandler,
  getCrewRoleByIdHandler,
};
