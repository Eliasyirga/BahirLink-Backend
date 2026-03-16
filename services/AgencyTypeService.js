const AgencyType = require("../models/AgencyType");

const createAgencyType = async (data) => {
  const { name, description } = data;

  const agencyType = await AgencyType.create({
    name,
    description,
  });

  return agencyType;
};

const updateAgencyType = async (id, data) => {
  const agencyType = await AgencyType.findByPk(id);

  if (!agencyType) {
    throw new Error("Agency type not found");
  }

  await agencyType.update(data);

  return agencyType;
};

const deleteAgencyType = async (id) => {
  const agencyType = await AgencyType.findByPk(id);

  if (!agencyType) {
    throw new Error("Agency type not found");
  }

  await agencyType.destroy();

  return { message: "Agency type deleted successfully" };
};

module.exports = {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
};
