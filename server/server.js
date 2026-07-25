const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const milkEntryRoutes = require("./routes/milkEntryRoutes");
console.log(milkEntryRoutes);
dotenv.config();
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const billingRoutes = require("./routes/billingRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/milk-entry", milkEntryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/settings", settingsRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Server is running successfully");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
