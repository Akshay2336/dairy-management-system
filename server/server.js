const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const milkEntryRoutes = require("./routes/milkEntryRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const billingRoutes = require("./routes/billingRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const aiRoutes = require("./routes/aiRoutes");

connectDB();
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/milk-entry", milkEntryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai", aiRoutes);
// Home Route
app.get("/", (req, res) => {
    res.send("Server is running successfully");
});

// ✅ Health Check Route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});