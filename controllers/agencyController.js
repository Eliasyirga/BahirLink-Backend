const {
  createAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies, // Now expects adminId
  loginAgency,
  getAgentsByCreatorId,
} = require("../services/agencyService");

const Agency = require("../models/Agency"); // Import your model

/**
 * Create a new Agent/Agency linked to the logged-in Admin
 */
/**
 * Create a new Agent/Agency linked to the logged-in Admin
 */
const createAgencyHandler = async (req, res) => {
  try {
    // 1. SAFETY GUARD: Check if req.user exists.
    // This stops the "TypeError: Cannot read properties of undefined (reading 'id')"
    if (!req.user || !req.user.id) {
      console.error(
        "DEBUG: req.user is undefined. Ensure 'verifyToken' is used in the route.",
      );
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin context missing. Please log in again.",
      });
    }

    // 2. Destructure data from request body
    let {
      name,
      username,
      password,
      email,
      phone,
      location,
      agencyTypeId,
      status,
    } = req.body;

    // 3. Extract the Admin ID from the authenticated User (attached by verifyToken)
    const adminId = req.user.id;

    // 4. Validation: Ensure agencyTypeId is a valid number
    agencyTypeId = Number(agencyTypeId);
    if (isNaN(agencyTypeId)) {
      return res.status(400).json({
        success: false,
        message: "agencyTypeId must be a valid number",
      });
    }

    // 5. Validation: Required fields check
    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username, and password are required",
      });
    }

    // 6. Call the service function
    // We pass adminId as the second argument so it can be saved in 'createdBy'
    const agency = await createAgency(
      {
        name,
        username,
        password,
        email,
        phone,
        location,
        agencyTypeId,
        status,
      },
      adminId,
    );

    // 7. Successful Response
    return res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: agency,
    });
  } catch (error) {
    console.error("CREATE AGENCY ERROR:", error);

    // Handle Sequelize Unique Constraint Errors (e.g., duplicate username)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Username or Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
/**
 * Get only the Agencies/Agents created by the logged-in Admin
 */
const getAllAgenciesHandler = async (req, res) => {
  try {
    // 1. Safety Check: Ensure the middleware actually populated req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Admin context missing. Please log in again.",
      });
    }

    const adminId = req.user.id;

    // 2. Pass adminId to service
    const agencies = await getAllAgencies(adminId);

    return res.status(200).json({
      success: true,
      count: agencies.length,
      data: agencies,
    });
  } catch (error) {
    console.error("FETCH ALL AGENCIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Update an Agency (Checks ownership via adminId)
 */
const updateAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }

    // Router guarantees: system admin, or an agency editing its own record.
    const self = req.user.type === "agency";
    if (self && String(req.user.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const agency = await updateAgency(id, req.body, { self });

    return res.status(200).json({
      success: true,
      message: "Agency updated successfully",
      data: agency,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Delete an Agency (Checks ownership via adminId)
 */
const deleteAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID is required" });
    }

    const result = await deleteAgency(id, adminId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Login Agency
 * (Unchanged, as agents/agencies still need to login themselves)
 */
const loginAgencyHandler = async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    const identifier = email || username;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing credentials" });
    }

    const { agency, token } = await loginAgency(identifier, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      agency,
      token,
    });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
};
const getAgentsByCreatorIdHandler = async (req, res) => {
  try {
    if (!req.user) {
      console.error(
        "DEBUG: req.user is undefined. Check if 'protect' middleware is in the route.",
      );
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access denied. No user context found.",
      });
    }

    // Now it is safe to access .id
    const adminId = req.user.id;

    const agents = await getAgentsByCreatorId(adminId);

    // 3. Send the response
    return res.status(200).json({
      success: true,
      count: agents.length,
      data: agents,
    });
  } catch (error) {
    console.error("GET AGENTS BY CREATOR ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
const getAgencyByIdHandler = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL (e.g., /api/agencies/5)

    // Agency defaultScope excludes the password hash.
    const agency = await Agency.findByPk(id);

    if (!agency) {
      return res.status(404).json({ message: "Agency not found" });
    }

    res.status(200).json({ data: agency });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving agency" });
  }
};

module.exports = {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
  getAllAgenciesHandler,
  loginAgencyHandler,
  getAgentsByCreatorIdHandler,
  getAgencyByIdHandler,
};
