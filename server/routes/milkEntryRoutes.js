
console.log("milkEntryRoutes file loaded");
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  addMilkEntry,getMilkEntries,updateMilkEntry,deleteMilkEntry,getMilkEntriesByCustomer,
} = require("../controllers/milkEntryController");

router.post("/", protect, addMilkEntry);
router.get("/", protect, getMilkEntries);
router.put("/:id", protect, updateMilkEntry);
router.delete("/:id", protect, deleteMilkEntry);
router.get("/customer/:customerId", protect, getMilkEntriesByCustomer);
console.log("Exporting router:", router);

module.exports = router;