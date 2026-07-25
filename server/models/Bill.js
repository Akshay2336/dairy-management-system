const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
      required: [true, "Start date is mandatory for custom range billing"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is mandatory for custom range billing"],
    },
    month: {
      type: Number,
      required: false, // Downgraded to optional for legacy tracking
    },
    year: {
      type: Number,
      required: false, // Downgraded to optional for legacy tracking
    },
    totalMilk: {
      type: Number,
      required: true,
      default: 0,
    },
    pricePerLitre: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Flexible index matching your custom window parameters
billSchema.index({ customerId: 1, startDate: 1, endDate: 1 }, { unique: true });

const Bill = mongoose.model("Bill", billSchema);

// AUTO INDEX MIGRATION HOOK
mongoose.connection.once("open", async () => {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: "bills" }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.collection("bills").dropIndex("customerId_1_month_1_year_1");
      console.log("[Index Migration] Dropped legacy month/year unique index safely.");
    }
  } catch (error) {
    console.log("[Index Migration] Legacy index already cleared or updated.");
  }
});

module.exports = Bill;