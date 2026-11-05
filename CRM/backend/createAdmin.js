const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB.");

    const existingAdmin = await User.findOne({
      email: "admin@crm.com",
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      name: "CRM Admin",
      email: "admin@crm.com",
      password: hashedPassword,
      role: "Admin",
      status: "Active",
    });

    await admin.save();

    console.log("Admin account created successfully!");
    console.log("Email: admin@crm.com");
    console.log("Password: Admin@123");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin:", error.message);
    await mongoose.disconnect();
  }
};

createAdmin();