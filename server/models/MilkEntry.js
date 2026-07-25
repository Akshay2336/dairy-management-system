const mongoose = require("mongoose");

const milkEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    morningMilk: {
      type: Number,
      default: 0,
    },

    eveningMilk: {
      type: Number,
      default: 0,
    },

    totalMilk: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MilkEntry", milkEntrySchema);