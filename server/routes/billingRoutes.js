const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getBills, generateBill, updateBillStatus, deleteBill } = require("../controllers/billingController");

router.get("/", protect, getBills);
router.post("/", protect, generateBill);
router.patch("/:id/status", protect, updateBillStatus);
router.delete("/:id", protect, deleteBill);

module.exports = router;