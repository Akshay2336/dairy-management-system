const Settings = require("../models/Settings");

// Get Settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({
      userId: req.user._id,
    });

    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
      });
    }

    res.status(200).json(settings);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// Update Settings
const updateSettings = async (req, res) => {
  try {
    const { cowMilkPrice, buffaloMilkPrice } = req.body;

    let settings = await Settings.findOne({
      userId: req.user._id,
    });

    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
      });
    }

    settings.cowMilkPrice = cowMilkPrice;
    settings.buffaloMilkPrice = buffaloMilkPrice;

    await settings.save();

    res.status(200).json({
      message: "Settings Updated Successfully",
      settings,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};