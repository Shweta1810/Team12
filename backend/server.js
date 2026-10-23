const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const leadRoutes = require("./routes/lead");
const customerRoutes = require("./routes/customer");
const interactionRoutes = require("./routes/interaction");
const followUpRoutes = require("./routes/followUp");
const feedbackRoutes = require("./routes/feedback");
const retentionRoutes = require("./routes/retention");
const loyaltyRoutes = require("./routes/loyalty");
const reportRoutes = require("./routes/report");
const saleRoutes = require("./routes/sale");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/retention", retentionRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sales", saleRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "CRM Backend is running successfully!",
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `CRM Backend running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });