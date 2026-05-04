const { Op } = require("sequelize");
const {
  sequelize,
  Emergency,

  EmergencyType,
  Kebele,
  ResponderTeam,
  Agency,
  AgencyType,
  Category,
  User,
  Guest,
  ResponderTeamKebele,
} = require("../models");
const path = require("path");

// Hard-coded mapping for agency types
const emergencyTypeToAgencyType = {
  Crime: "Police",
  Health: "Health",
  Fire: "Fire",
};

// Default EmergencyType ID for fallback
const DEFAULT_EMERGENCY_TYPE_ID = "00000000-0000-0000-0000-000000000001";

const createGuestEmergency = async (data, file, transaction) => {
  try {
    const emergencyData = { ...data };

    // Device tracking
    emergencyData.deviceId = emergencyData.deviceId || null;

    // Kebele fix
    if (emergencyData.kebeleId || emergencyData.kebele) {
      emergencyData.kebeleId = parseInt(
        emergencyData.kebeleId || emergencyData.kebele,
      );
      delete emergencyData.kebele;
    }

    // Validationconst { Op } = require("sequelize");
    const {
      sequelize,
      Emergency,

      EmergencyType,
      Kebele,
      ResponderTeam,
      Agency,
      AgencyType,
      Category,
      User,
      Guest,
      ResponderTeamKebele,
    } = require("../models");
    const path = require("path");

    // Hard-coded mapping for agency types
    const emergencyTypeToAgencyType = {
      Crime: "Police",
      Health: "Health",
      Fire: "Fire",
    };

    // Default EmergencyType ID for fallback
    const DEFAULT_EMERGENCY_TYPE_ID = "00000000-0000-0000-0000-000000000001";

    const createGuestEmergency = async (data, file, transaction) => {
      try {
        const emergencyData = { ...data };

        // Device tracking
        emergencyData.deviceId = emergencyData.deviceId || null;

        // Kebele fix
        if (emergencyData.kebeleId || emergencyData.kebele) {
          emergencyData.kebeleId = parseInt(
            emergencyData.kebeleId || emergencyData.kebele,
          );
          delete emergencyData.kebele;
        }

        // Validation
        if (!emergencyData.kebeleId) {
          throw new Error("kebeleId is required");
        }

        // Location fix
        if (emergencyData.latitude && emergencyData.longitude) {
          emergencyData.location = {
            latitude: parseFloat(emergencyData.latitude),
            longitude: parseFloat(emergencyData.longitude),
          };
          delete emergencyData.latitude;
          delete emergencyData.longitude;
        }

        // Time fix (safe)
        if (emergencyData.time) {
          const d = new Date(emergencyData.time);

          emergencyData.time = [
            String(d.getHours()).padStart(2, "0"),
            String(d.getMinutes()).padStart(2, "0"),
            String(d.getSeconds()).padStart(2, "0"),
          ].join(":");
        }
        // File
        if (file) {
          emergencyData.mediaUrl = `/uploads/${file.filename}`;
        }

        // IMPORTANT defaults
        emergencyData.reporterType = "guest";
        emergencyData.status = "reported";

        console.log("🔥 FINAL GUEST EMERGENCY:", emergencyData);

        return await Emergency.create(
          emergencyData,
          transaction ? { transaction } : {},
        );
      } catch (error) {
        throw error;
      }
    };

    // =========================
    // CREATE USER EMERGENCY
    // =========================
    const createUserEmergency = async (userId, emergencyData, file) => {
      let {
        mediaType,
        emergencyTypeId = DEFAULT_EMERGENCY_TYPE_ID,
        categoryId,
        time,
        kebeleId,
        subdivision,
        street,
        location,
        latitude,
        longitude,
        ...rest
      } = emergencyData;

      if (latitude && longitude) {
        location = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      }

      // Validation
      if (!kebeleId || !subdivision)
        throw new Error("Kebele ID and Subdivision are required");

      const kebeleRecord = await Kebele.findByPk(kebeleId);
      if (!kebeleRecord) throw new Error("Invalid kebele ID");

      const mediaUrl = file ? `/public/uploads/${file.filename}` : null;

      return await Emergency.create({
        ...rest,
        kebeleId: kebeleRecord.id,
        subdivision,
        street,
        location,
        mediaUrl,
        emergencyTypeId,
        categoryId,
        time,
        mediaType:
          mediaType ??
          (file
            ? file.mimetype.startsWith("video")
              ? "video"
              : "photo"
            : null),
        citizenId: userId,
        status: "reported",
        reporterType: "user",
      });
    };

    const updateEmergency = async (
      userOrGuestId,
      emergencyId,
      updatedData,
      file,
      isGuest = false,
    ) => {
      const whereClause = isGuest
        ? { id: emergencyId, guestId: userOrGuestId }
        : { id: emergencyId, citizenId: userOrGuestId };

      const emergency = await Emergency.findOne({ where: whereClause });
      if (!emergency) throw new Error("Emergency not found");

      if (file) {
        updatedData.mediaUrl = `/public/uploads/${file.filename}`;
        updatedData.mediaType = file.mimetype.startsWith("video")
          ? "video"
          : "photo";
      }

      return await emergency.update(updatedData);
    };

    // =========================
    // DELETE EMERGENCY
    // =========================
    const deleteEmergency = async (
      userOrGuestId,
      emergencyId,
      isGuest = false,
    ) => {
      const whereClause = isGuest
        ? { id: emergencyId, guestId: userOrGuestId }
        : { id: emergencyId, citizenId: userOrGuestId };

      const emergency = await Emergency.findOne({ where: whereClause });
      if (!emergency) throw new Error("Emergency not found");

      await emergency.destroy();
      return { message: "Emergency deleted successfully" };
    };

    // =========================
    // GET USER/GUEST EMERGENCIES
    // =========================
    const getEmergencies = async (userOrGuestId, isGuest = false) => {
      const whereClause = isGuest
        ? { guestId: userOrGuestId }
        : { citizenId: userOrGuestId };

      return await Emergency.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        include: [
          { model: EmergencyType, as: "emergencyType" },
          { model: Kebele, as: "kebele" },
        ],
      });
    };

    // =========================
    // GET EMERGENCIES BY AGENCY
    // =========================
    const getEmergenciesByAgency = async (agencyId) => {
      const agency = await Agency.findByPk(agencyId, {
        include: { model: AgencyType, as: "agencyType" },
      });

      if (!agency) throw new Error("Agency not found");

      const agencyTypeName = agency.agencyType?.name;
      if (!agencyTypeName) return [];

      // 2️⃣ Get emergency types handled by this agency type
      const handledEmergencyTypes = Object.entries(emergencyTypeToAgencyType)
        .filter(([etype, aType]) => aType === agencyTypeName)
        .map(([etype]) => etype);

      if (!handledEmergencyTypes.length) return [];

      // 3️⃣ Fetch emergencies for these types
      const emergencies = await Emergency.findAll({
        include: [
          {
            model: EmergencyType,
            as: "emergencyType",
            where: { name: handledEmergencyTypes },
            attributes: ["id", "name", "description"],
          },
          { model: Kebele, as: "kebele", attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      return emergencies;
    };

    const getEmergenciesForResponderTeam = async (responderTeamId) => {
      // 1. Get the team to identify their agency type
      const team = await ResponderTeam.findByPk(responderTeamId, {
        include: [{ model: Agency, as: "agency" }],
      });

      if (!team) throw new Error("Team not found");

      // Police (2) -> Crime (1), Fire (1) -> Fire (2), Health (3) -> Health (3)
      const roleMapping = { 2: 1, 1: 2, 3: 3 };
      const targetType = roleMapping[team.agency.agencyTypeId] || 1;

      return await Emergency.findAll({
        where: {
          emergencyTypeId: targetType,
          status: { [Op.ne]: "resolved" },
        },
        // 🚨 VERY IMPORTANT: Prevents Sequelize from creating a separate
        // sub-select query that often misses many-to-many results.
        subQuery: false,
        include: [
          {
            model: Kebele,
            as: "kebele",
            required: true, // Emergency must have a Kebele
            include: [
              {
                model: ResponderTeam,
                as: "teams",
                where: { id: responderTeamId },
                required: true, // ONLY incidents linked to this team's kebeles
                through: {
                  model: ResponderTeamKebele,
                  attributes: [], // Keep the payload clean
                },
              },
            ],
          },
          { model: EmergencyType, as: "emergencyType", attributes: ["name"] },
          { model: Category, as: "category", attributes: ["name"] },
        ],
        order: [["createdAt", "DESC"]],
      });
    };

    const getAllEmergenciesForAdmin = async () => {
      try {
        const emergencies = await Emergency.findAll({
          include: [
            {
              model: EmergencyType,
              as: "emergencyType",
              attributes: ["id", "name"],
            },
            {
              model: Category,
              as: "category",
              attributes: ["id", "name"],
            },
            {
              model: Kebele,
              as: "kebele",
              attributes: ["id", "name"],
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "phone"],
            },
            {
              model: Guest,
              as: "guest",
              attributes: ["id", "contactNo"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        const result = emergencies.map((e) => ({
          id: e.id,
          emergencyType: e.emergencyType?.name || null,
          category: e.category?.name || null,
          kebele: e.kebele?.name || null,
          subdivision: e.subdivision,
          street: e.street,

          reporterType: e.user ? "user" : "guest",
          reporterName: e.user
            ? e.user.fullName || "Registered User"
            : e.guest?.contactNo || "Guest",

          deviceId: e.deviceId, // 🔥 THIS WAS MISSING

          status: e.status,
          createdAt: e.createdAt,
        }));
        return result;
      } catch (err) {
        console.error("❌ Error in getAllEmergenciesForAdmin:", err);
        throw err;
      }
    };

    // =========================
    // GET SINGLE EMERGENCY BY ID
    // =========================
    const getEmergencyById = async (id) => {
      try {
        const emergency = await Emergency.findByPk(id, {
          include: [
            {
              model: EmergencyType,
              as: "emergencyType",
              attributes: ["id", "name", "description"],
            },
            {
              model: Category,
              as: "category",
              attributes: ["id", "name"],
            },
            {
              model: Kebele,
              as: "kebele",
              attributes: ["id", "name"],
            },
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "email", "phone"],
            },
            {
              model: Guest,
              as: "guest",
              attributes: ["id", "contactNo"],
            },
          ],
        });

        if (!emergency) return null;

        // Optional: Format the object similarly to how you did for Admin
        // This ensures the frontend gets clean "reporterName" and "kebele" strings
        const formattedData = {
          ...emergency.toJSON(), // Spread all original fields (description, location, etc.)
          reporterName: emergency.user
            ? emergency.user.fullName
            : emergency.guest?.contactNo || "Anonymous Guest",
          reporterPhone: emergency.user
            ? emergency.user.phone
            : emergency.guest?.contactNo,
          // Ensure location is parsed correctly for the map
          location:
            typeof emergency.location === "string"
              ? JSON.parse(emergency.location)
              : emergency.location,
        };

        return formattedData;
      } catch (err) {
        console.error("❌ Error in getEmergencyById:", err);
        throw err;
      }
    };

    const updateEmergencyStatus = async (
      emergencyId,
      status,
      report = null,
    ) => {
      const emergency = await Emergency.findByPk(emergencyId);

      if (!emergency) {
        throw new Error("Emergency record not found in database");
      }

      // Update the fields
      emergency.status = status;
      if (report) {
        emergency.report = report; // Ensure your Model has a 'report' column
      }

      return await emergency.save();
    };
    const getEmergenciesByDeviceId = async (deviceId) => {
      if (!deviceId) throw new Error("deviceId is required");

      const emergencies = await Emergency.findAll({
        where: { deviceId },
        include: [
          {
            model: EmergencyType,
            as: "emergencyType",
            attributes: ["id", "name"],
          },
          { model: Category, as: "category", attributes: ["id", "name"] },
          { model: Kebele, as: "kebele", attributes: ["id", "name"] },
          { model: User, as: "user", attributes: ["id", "fullName"] },
          { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      return emergencies.map((e) => ({
        id: e.id,
        emergencyType: e.emergencyType?.name || null,
        category: e.category?.name || null,
        kebele: e.kebele?.name || null,
        subdivision: e.subdivision,
        street: e.street,
        status: e.status,

        reporterType: e.user ? "user" : "guest",
        reporterName: e.user ? e.user.fullName : e.guest?.contactNo || "Guest",

        deviceId: e.deviceId,
        createdAt: e.createdAt,
      }));
    };

    module.exports = {
      createGuestEmergency,
      createUserEmergency,
      updateEmergency,
      deleteEmergency,
      getEmergencies,
      getEmergencyById,
      getEmergenciesForResponderTeam,
      getEmergenciesByAgency,
      getAllEmergenciesForAdmin,
      updateEmergencyStatus,
      getEmergenciesByDeviceId,
    };

    if (!emergencyData.kebeleId) {
      throw new Error("kebeleId is required");
    }

    // Location fix
    if (emergencyData.latitude && emergencyData.longitude) {
      emergencyData.location = {
        latitude: parseFloat(emergencyData.latitude),
        longitude: parseFloat(emergencyData.longitude),
      };
      delete emergencyData.latitude;
      delete emergencyData.longitude;
    }

    // Time fix (safe)
    if (emergencyData.time) {
      const d = new Date(emergencyData.time);

      emergencyData.time = [
        String(d.getHours()).padStart(2, "0"),
        String(d.getMinutes()).padStart(2, "0"),
        String(d.getSeconds()).padStart(2, "0"),
      ].join(":");
    }
    // File
    if (file) {
      emergencyData.mediaUrl = `/uploads/${file.filename}`;
    }

    // IMPORTANT defaults
    emergencyData.reporterType = "guest";
    emergencyData.status = "reported";

    console.log("🔥 FINAL GUEST EMERGENCY:", emergencyData);

    return await Emergency.create(
      emergencyData,
      transaction ? { transaction } : {},
    );
  } catch (error) {
    throw error;
  }
};

// =========================
// CREATE USER EMERGENCY
// =========================
const createUserEmergency = async (userId, emergencyData, file) => {
  let {
    mediaType,
    emergencyTypeId = DEFAULT_EMERGENCY_TYPE_ID,
    categoryId,
    time,
    kebeleId,
    subdivision,
    street,
    location,
    latitude,
    longitude,
    ...rest
  } = emergencyData;

  if (latitude && longitude) {
    location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
  }

  // Validation
  if (!kebeleId || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  const kebeleRecord = await Kebele.findByPk(kebeleId);
  if (!kebeleRecord) throw new Error("Invalid kebele ID");

  const mediaUrl = file ? `/public/uploads/${file.filename}` : null;

  return await Emergency.create({
    ...rest,
    kebeleId: kebeleRecord.id,
    subdivision,
    street,
    location,
    mediaUrl,
    emergencyTypeId,
    categoryId,
    time,
    mediaType:
      mediaType ??
      (file ? (file.mimetype.startsWith("video") ? "video" : "photo") : null),
    citizenId: userId,
    status: "reported",
    reporterType: "user",
  });
};

const updateEmergency = async (
  userOrGuestId,
  emergencyId,
  updatedData,
  file,
  isGuest = false,
) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  if (file) {
    updatedData.mediaUrl = `/public/uploads/${file.filename}`;
    updatedData.mediaType = file.mimetype.startsWith("video")
      ? "video"
      : "photo";
  }

  return await emergency.update(updatedData);
};

// =========================
// DELETE EMERGENCY
// =========================
const deleteEmergency = async (userOrGuestId, emergencyId, isGuest = false) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  await emergency.destroy();
  return { message: "Emergency deleted successfully" };
};

// =========================
// GET USER/GUEST EMERGENCIES
// =========================
const getEmergencies = async (userOrGuestId, isGuest = false) => {
  const whereClause = isGuest
    ? { guestId: userOrGuestId }
    : { citizenId: userOrGuestId };

  return await Emergency.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Kebele, as: "kebele" },
    ],
  });
};

// =========================
// GET EMERGENCIES BY AGENCY
// =========================
const getEmergenciesByAgency = async (agencyId) => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) return [];

  // 2️⃣ Get emergency types handled by this agency type
  const handledEmergencyTypes = Object.entries(emergencyTypeToAgencyType)
    .filter(([etype, aType]) => aType === agencyTypeName)
    .map(([etype]) => etype);

  if (!handledEmergencyTypes.length) return [];

  // 3️⃣ Fetch emergencies for these types
  const emergencies = await Emergency.findAll({
    include: [
      {
        model: EmergencyType,
        as: "emergencyType",
        where: { name: handledEmergencyTypes },
        attributes: ["id", "name", "description"],
      },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies;
};
const getEmergenciesForResponderTeam = async (responderTeamId) => {
  // 1. Get the team to identify their agency type
  const team = await ResponderTeam.findByPk(responderTeamId, {
    include: [{ model: Agency, as: "agency" }],
  });

  if (!team) throw new Error("Team not found");

  const roleMapping = { 2: 1, 1: 2, 3: 3 };
  const targetType = roleMapping[team.agency.agencyTypeId] || 1;

  return await Emergency.findAll({
    where: {
      emergencyTypeId: targetType,
      // 🚨 REMOVED: status: { [Op.ne]: "resolved" }
      // This allows the query to fetch "resolved" incidents along with "reported" and "pending"
    },
    subQuery: false,
    include: [
      {
        model: Kebele,
        as: "kebele",
        required: true,
        include: [
          {
            model: ResponderTeam,
            as: "teams",
            where: { id: responderTeamId },
            required: true,
            through: {
              model: ResponderTeamKebele,
              attributes: [],
            },
          },
        ],
      },
      { model: EmergencyType, as: "emergencyType", attributes: ["name"] },
      { model: Category, as: "category", attributes: ["name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const getAllEmergenciesForAdmin = async () => {
  try {
    const emergencies = await Emergency.findAll({
      include: [
        {
          model: EmergencyType,
          as: "emergencyType",
          attributes: ["id", "name"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Kebele,
          as: "kebele",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Guest,
          as: "guest",
          attributes: ["id", "contactNo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = emergencies.map((e) => ({
      id: e.id,
      emergencyType: e.emergencyType?.name || null,
      category: e.category?.name || null,
      kebele: e.kebele?.name || null,
      subdivision: e.subdivision,
      street: e.street,

      reporterType: e.user ? "user" : "guest",
      reporterName: e.user
        ? e.user.fullName || "Registered User"
        : e.guest?.contactNo || "Guest",

      deviceId: e.deviceId, // 🔥 THIS WAS MISSING

      status: e.status,
      createdAt: e.createdAt,
    }));
    return result;
  } catch (err) {
    console.error("❌ Error in getAllEmergenciesForAdmin:", err);
    throw err;
  }
};

// =========================
// GET SINGLE EMERGENCY BY ID
// =========================
const getEmergencyById = async (id) => {
  try {
    const emergency = await Emergency.findByPk(id, {
      include: [
        {
          model: EmergencyType,
          as: "emergencyType",
          attributes: ["id", "name", "description"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Kebele,
          as: "kebele",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Guest,
          as: "guest",
          attributes: ["id", "contactNo"],
        },
      ],
    });

    if (!emergency) return null;

    // Optional: Format the object similarly to how you did for Admin
    // This ensures the frontend gets clean "reporterName" and "kebele" strings
    const formattedData = {
      ...emergency.toJSON(), // Spread all original fields (description, location, etc.)
      reporterName: emergency.user
        ? emergency.user.fullName
        : emergency.guest?.contactNo || "Anonymous Guest",
      reporterPhone: emergency.user
        ? emergency.user.phone
        : emergency.guest?.contactNo,
      // Ensure location is parsed correctly for the map
      location:
        typeof emergency.location === "string"
          ? JSON.parse(emergency.location)
          : emergency.location,
    };

    return formattedData;
  } catch (err) {
    console.error("❌ Error in getEmergencyById:", err);
    throw err;
  }
};

const updateEmergencyStatus = async (emergencyId, status, report = null) => {
  const emergency = await Emergency.findByPk(emergencyId);

  if (!emergency) {
    throw new Error("Emergency record not found in database");
  }

  // Update the fields
  emergency.status = status;
  if (report) {
    emergency.report = report; // Ensure your Model has a 'report' column
  }

  return await emergency.save();
};
const getEmergenciesByDeviceId = async (deviceId) => {
  if (!deviceId) throw new Error("deviceId is required");

  const emergencies = await Emergency.findAll({
    where: { deviceId },
    include: [
      { model: EmergencyType, as: "emergencyType", attributes: ["id", "name"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "fullName"] },
      { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies.map((e) => ({
    id: e.id,
    emergencyType: e.emergencyType?.name || null,
    category: e.category?.name || null,
    kebele: e.kebele?.name || null,
    subdivision: e.subdivision,
    street: e.street,
    status: e.status,

    reporterType: e.user ? "user" : "guest",
    reporterName: e.user ? e.user.fullName : e.guest?.contactNo || "Guest",

    deviceId: e.deviceId,
    createdAt: e.createdAt,
  }));
};

module.exports = {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergencyById,
  getEmergenciesForResponderTeam,
  getEmergenciesByAgency,
  getAllEmergenciesForAdmin,
  updateEmergencyStatus,
  getEmergenciesByDeviceId,
};
