const Crew = require("../models/Crew");
const bcrypt = require("bcryptjs");


const createCrew = async (data) => {
  const { name, username, email, password, phone, status, responderTeamId, roleId } = data;

  if (!name || !username || !email || !password || !responderTeamId || !roleId) {
    throw new Error(
      "Name, username, email, password, responderTeamId, and roleId are required"
    );
  }

  const existingUsername = await Crew.findOne({ where: { username } });
  if (existingUsername) throw new Error("Username already exists");

  const existingEmail = await Crew.findOne({ where: { email } });
  if (existingEmail) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const crew = await Crew.create({
    name,
    username,
    email,
    password: hashedPassword,
    phone,
    status: status || "active",
    responderTeamId,
    roleId,
  });

  return crew;
};


const updateCrew = async (id, data) => {
  const crew = await Crew.findByPk(id);
  if (!crew) throw new Error("Crew member not found");

  const { password, username, email, ...otherData } = data;

  if (username && username !== crew.username) {
    const existingUsername = await Crew.findOne({ where: { username } });
    if (existingUsername) throw new Error("Username already exists");
  }

  if (email && email !== crew.email) {
    const existingEmail = await Crew.findOne({ where: { email } });
    if (existingEmail) throw new Error("Email already exists");
  }

  if (password) {
    otherData.password = await bcrypt.hash(password, 10);
  }

  await crew.update({ username, email, ...otherData });

  return crew;
};


const deleteCrew = async (id) => {
  const crew = await Crew.findByPk(id);
  if (!crew) throw new Error("Crew member not found");

  await crew.destroy();
  return { message: "Crew member deleted successfully" };
};

module.exports = {
  createCrew,
  updateCrew,
  deleteCrew,
};