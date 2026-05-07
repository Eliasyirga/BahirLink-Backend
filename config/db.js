require("dotenv").config(); // ← MUST be first, before anything reads process.env

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL (Neon) connected via Sequelize");
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };