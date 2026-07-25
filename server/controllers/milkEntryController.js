console.log("milkEntryController loaded");
const MilkEntry = require("../models/MilkEntry");

// Add Milk Entry
const addMilkEntry = async (req, res) => {
  try {
    const { customerId, date, morningMilk, eveningMilk } = req.body;

    // Validation
    if (!customerId || !date) {
      return res.status(400).json({
        message: "Customer and Date are required",
      });
    }

    // Check duplicate entry
    const existingEntry = await MilkEntry.findOne({
      userId: req.user._id,
      customerId,
      date,
    });

    if (existingEntry) {
      return res.status(400).json({
        message: "Milk entry already exists for this customer on this date",
      });
    }

    // Calculate total milk
    const totalMilk =
      Number(morningMilk || 0) + Number(eveningMilk || 0);

    // Create entry
    const milkEntry = await MilkEntry.create({
      userId: req.user._id,
      customerId,
      date,
      morningMilk,
      eveningMilk,
      totalMilk,
    });

    res.status(201).json({
      message: "Milk Entry Added Successfully",
      milkEntry,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Get Milk Entries
const getMilkEntries = async (req, res) => {
  try {

    const milkEntries = await MilkEntry.find({
      userId: req.user._id,
    })
      .populate("customerId", "name phone milkType")
      .sort({ date: -1 });


   res.status(200).json(milkEntries);
  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
};

// Update Milk Entry
const updateMilkEntry = async (req, res) => {
  try {

    const { morningMilk, eveningMilk } = req.body;

    const milkEntry = await MilkEntry.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });


    if (!milkEntry) {
      return res.status(404).json({
        message: "Milk Entry not found",
      });
    }


    milkEntry.morningMilk = morningMilk ?? milkEntry.morningMilk;
    milkEntry.eveningMilk = eveningMilk ?? milkEntry.eveningMilk;


    milkEntry.totalMilk =
      Number(milkEntry.morningMilk) +
      Number(milkEntry.eveningMilk);


    await milkEntry.save();


    res.status(200).json({
      message: "Milk Entry Updated Successfully",
      milkEntry,
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
};

// Delete Milk Entry
const deleteMilkEntry = async (req, res) => {
  try {

    const milkEntry = await MilkEntry.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });


    if (!milkEntry) {
      return res.status(404).json({
        message: "Milk Entry not found",
      });
    }


    await milkEntry.deleteOne();


    res.status(200).json({
      message: "Milk Entry Deleted Successfully",
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
};

// Get Milk Entries By Customer
const getMilkEntriesByCustomer = async (req, res) => {
  try {
    const milkEntries = await MilkEntry.find({
      userId: req.user._id,
      customerId: req.params.customerId,
    }).sort({ date: -1 });

    res.status(200).json({
      milkEntries,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  addMilkEntry,getMilkEntries,updateMilkEntry,deleteMilkEntry,getMilkEntriesByCustomer,
};