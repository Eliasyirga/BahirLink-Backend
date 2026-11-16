const {
  createCrew,
  updateCrew,
  deleteCrew,
  loginCrew,
} = require("../services/crewService");
const { canManageTeam, canManageCrew } = require("../utils/ownership");

const denied = (res) =>
  res.status(403).json({ success: false, message: "Access denied" });

/**
 * Create a Crew member (system admin, agency for its teams, responder for itself)
 */
const createCrewHandler = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      phone,
      status,
      responderTeamId,
      roleId,
    } = req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !responderTeamId ||
      !roleId
    ) {
      return res.status(400).json({
        message:
          "Name, username, email, password, responderTeamId, and roleId are required",
      });
    }

    if (!(await canManageTeam(req.user, responderTeamId))) return denied(res);

    const crew = await createCrew({
      name,
      username,
      email,
      password,
      phone,
      status,
      responderTeamId,
      roleId,
    });

    res.status(201).json({
      message: "Crew member created successfully",
      data: crew,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a Crew member — managers of the crew's team, or the crew member
 * themself (name/phone/password only).
 */
const updateCrewHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const self = req.user.type === "crew";

    if (self) {
      if (String(req.user.id) !== String(id)) return denied(res);
    } else {
      const allowed = await canManageCrew(req.user, id);
      if (allowed === null)
        return res.status(404).json({ message: "Crew member not found" });
      if (!allowed) return denied(res);
      if (
        req.body.responderTeamId !== undefined &&
        !(await canManageTeam(req.user, req.body.responderTeamId))
      ) {
        return denied(res);
      }
    }

    const crew = await updateCrew(id, req.body, { self });

    res.status(200).json({
      message: "Crew member updated successfully",
      data: crew,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a Crew member
 */
const deleteCrewHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const allowed = await canManageCrew(req.user, id);
    if (allowed === null)
      return res.status(404).json({ message: "Crew member not found" });
    if (!allowed) return denied(res);

    const result = await deleteCrew(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginCrewHandler = async (req, res) => {
  try {
    const result = await loginCrew(req.body);

    return res.status(200).json({
      success: true,
      message: "Crew login successful",
      token: result.token,
      crew: result.crew,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
};

module.exports = {
  createCrewHandler,
  updateCrewHandler,
  deleteCrewHandler,
  loginCrewHandler,
};
