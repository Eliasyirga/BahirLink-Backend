const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Optional fields
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    fullName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    role: {
      type: DataTypes.ENUM("user", "provider", "admin"),
      defaultValue: "user",
    },
    isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isPhoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isNationalIDVerified: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Tokens
    verificationToken: { type: DataTypes.STRING },
    verificationTokenExpires: { type: DataTypes.DATE },
    resetPasswordToken: { type: DataTypes.STRING },
    resetPasswordExpires: { type: DataTypes.DATE },
    refreshToken: { type: DataTypes.STRING },
    googleId: { type: DataTypes.STRING },

    // Verification codes
    verificationCode: { type: DataTypes.INTEGER },
    verificationCodeExpires: { type: DataTypes.BIGINT },

    // Optional personal info
    nationalID: { type: DataTypes.STRING },
    nationalIDImage: { type: DataTypes.STRING },
    country: { type: DataTypes.STRING },
    region: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    dateOfBirth: { type: DataTypes.DATE },
    gender: { type: DataTypes.ENUM("male", "female", "other") },

    // User profile
    profileImage: { type: DataTypes.STRING },
    bio: { type: DataTypes.STRING },

    // System info
    lastLogin: { type: DataTypes.DATE },
    lastPasswordChange: { type: DataTypes.DATE },
    loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    timestamps: true, // createdAt & updatedAt
    tableName: "users",
  }
);

module.exports = User;
