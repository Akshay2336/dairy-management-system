const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const MilkEntry = require("../models/MilkEntry"); // Adjust path based on your setup

// Get all bills for a logged-in user
const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user._id })
      .populate("customerId", "name phone milkType")
      .sort({ createdAt: -1 });
    return res.status(200).json(bills);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Generate or update custom date range bill
const generateBill = async (req, res) => {
  try {
    const { customerId, pricePerLitre, startDate, endDate, allowUpdate } = req.body;

    if (!customerId || !pricePerLitre || !startDate || !endDate) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const rate = Number(pricePerLitre);
    const startIso = new Date(startDate);
    const endIso = new Date(endDate);
    endIso.setHours(23, 59, 59, 999); // Cover entire final day

    if (startIso > endIso) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    // Aggregate milk logs inside the date custom window
    const milkEntries = await MilkEntry.find({
      customerId,
      date: { $gte: startIso, $lte: endIso },
    });

    const totalMilk = milkEntries.reduce((sum, entry) => {
      const morning = Number(entry.morningMilk || 0);
      const evening = Number(entry.eveningMilk || 0);
      const explicitTotal = Number(entry.totalMilk || entry.quantity || entry.litres || 0);
      return sum + (morning + evening || explicitTotal);
    }, 0);

    if (totalMilk === 0) {
      return res.status(400).json({
        message: "No milk records found for this customer within the selected date range.",
      });
    }

    const totalAmount = totalMilk * rate;

    let existingBill = await Bill.findOne({
      userId: req.user._id,
      customerId: customer._id,
      startDate: startIso,
      endDate: endIso
    });

    if (existingBill && !allowUpdate) {
      return res.status(409).json({
        billExists: true,
        message: "A bill matching this exact date range already exists for this customer. Overwrite it?"
      });
    }

    if (existingBill && allowUpdate) {
      existingBill.totalMilk = totalMilk;
      existingBill.pricePerLitre = rate;
      existingBill.totalAmount = totalAmount;
      await existingBill.save();
      return res.status(200).json({ message: "Bill updated successfully", bill: existingBill });
    }

    const newBill = await Bill.create({
      userId: req.user._id,
      customerId: customer._id,
      startDate: startIso,
      endDate: endIso,
      totalMilk,
      pricePerLitre: rate,
      totalAmount,
      paymentStatus: "Pending"
    });

    return res.status(201).json({ message: "Bill Generated Successfully", bill: newBill });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("--- MONGOOSE VALIDATION DETAIL ---", error.errors);
    }
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update Payment Status
const updateBillStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!["Pending", "Paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status choice." });
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { paymentStatus },
      { new: true }
    ).populate("customerId", "name phone milkType");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found or unauthorized access." });
    }

    return res.status(200).json({ message: `Bill marked as ${paymentStatus}`, bill });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a bill record completely
const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found or unauthorized to delete." });
    }
    return res.status(200).json({ message: "Bill deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { getBills, generateBill, updateBillStatus, deleteBill };


