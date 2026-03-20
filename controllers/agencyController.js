const {
  createAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies,
  loginAgency,
} = require("../services/agencyService");

/**
 * Create a new Agency
 */
const createAgencyHandler = async (req, res) => {
  try {
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

    console.log("CREATE AGENCY REQ BODY:", req.body);

    // Ensure agencyTypeId is a number
    agencyTypeId = Number(agencyTypeId);
    if (isNaN(agencyTypeId)) {
      return res.status(400).json({
        success: false,
        message: "agencyTypeId must be a valid number",
      });
    }

    // Required fields validation
    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username, and password are required",
      });
    }

    const agency = await createAgency({
      name,
      username,
      password,
      email,
      phone,
      location,
      agencyTypeId,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Agency created successfully",
      data: agency,
    });
  } catch (error) {
    console.error("CREATE AGENCY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      errors: error.errors || null, // Sequelize validation errors
    });
  }
};

/**
 * Update an existing Agency
 */
const updateAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("UPDATE AGENCY REQ BODY:", req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required in params",
      });
    }

    const agency = await updateAgency(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Agency updated successfully",
      data: agency,
    });
  } catch (error) {
    console.error("UPDATE AGENCY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      errors: error.errors || null,
    });
  }
};

/**
 * Delete an Agency
 */
const deleteAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }

    const result = await deleteAgency(id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("DELETE AGENCY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      errors: error.errors || null,
    });
  }
};

/**
 * Get all Agencies
 */
const getAllAgenciesHandler = async (req, res) => {
  try {
    const agencies = await getAllAgencies();
    return res.status(200).json({
      success: true,
      data: agencies,
    });
  } catch (error) {
    console.error("FETCH ALL AGENCIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      errors: error.errors || null,
    });
  }
};

/**
 * Login Agency
 */
const loginAgencyHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { agency, token } = await loginAgency(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      agency,
      token,
    });
  } catch (error) {
    console.error("AGENCY LOGIN ERROR:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }
};

module.exports = {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
  getAllAgenciesHandler,
  loginAgencyHandler,
};
