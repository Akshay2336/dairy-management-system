const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { GoogleGenAI } = require("@google/genai");

const Customer = require("../models/Customer");
const MilkEntry = require("../models/MilkEntry");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// =====================================================
// TEXT AI
// =====================================================

router.post("/chat", protect, async (req, res) => {
  try {
    console.log("👤 AI User:", req.user._id);
    console.log("📧 User Email:", req.user.email);

    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    console.log("❓ Question:", question);

    // =====================================================
    // GET USER'S CUSTOMERS
    // =====================================================

    const customers = await Customer.find({
      userId: req.user._id,
    }).select("name phone milkType status");

    console.log("👥 Customers found:", customers.length);

    // =====================================================
    // GET USER'S MILK ENTRIES
    // =====================================================

    const milkEntries = await MilkEntry.find({
      userId: req.user._id,
    })
      .populate("customerId", "name milkType")
      .sort({ date: -1 });

    console.log("🥛 Milk entries found:", milkEntries.length);

    // =====================================================
    // PREPARE DATABASE INFORMATION
    // =====================================================

    const customerData = customers.map((customer) => ({
      name: customer.name,
      phone: customer.phone,
      milkType: customer.milkType,
      status: customer.status,
    }));

    const milkData = milkEntries.map((entry) => ({
      customerName: entry.customerId?.name,
      date: entry.date,
      morningMilk: entry.morningMilk,
      eveningMilk: entry.eveningMilk,
      totalMilk: entry.totalMilk,
    }));

    // =====================================================
    // SEND QUESTION + DATABASE DATA TO GEMINI
    // =====================================================

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      config: {
        systemInstruction: `
You are a Dairy Management Assistant.

You have access to REAL data from the logged-in user's dairy management system.

IMPORTANT RULES:

1. Only use the database information provided below.
2. Never invent customers, milk quantities, dates, prices, bills, or payments.
3. If the requested information is not present in the database, clearly say that it is not available.
4. Answer the user's question directly and simply.
5. When calculating milk quantities, use the provided milk entries.
6. Do not reveal database IDs.
7. Do not mention that you are reading a JSON/database unless necessary.

CUSTOMERS:
${JSON.stringify(customerData, null, 2)}

MILK ENTRIES:
${JSON.stringify(milkData, null, 2)}
        `,
      },

      contents: question,
    });

    console.log("🤖 Gemini answer:", response.text);

    res.json({
      success: true,
      answer: response.text,
    });

  } catch (error) {
    console.error("❌ AI Error:", error);

    res.status(500).json({
      success: false,
      message: "AI request failed",
      error: error.message,
    });
  }
});


// =====================================================
// VOICE AI
// =====================================================

// =====================================================
// VOICE AI
// =====================================================

router.post("/voice", protect, async (req, res) => {
  try {
    const { audio, mimeType } = req.body;

    if (!audio) {
      return res.status(400).json({
        success: false,
        message: "Audio is required",
      });
    }

    // Reject extremely small recordings
    if (audio.length < 1000) {
      return res.status(400).json({
        success: false,
        message: "No clear voice was detected. Please speak your question.",
      });
    }

    console.log("🎤 Voice request received");
    console.log("👤 User:", req.user._id);
    console.log("Audio MIME type:", mimeType);
    console.log("Audio size:", audio.length);

    // =====================================================
    // GET USER'S CUSTOMERS
    // =====================================================

    const customers = await Customer.find({
      userId: req.user._id,
    }).select("name phone milkType status");

    console.log("👥 Customers found:", customers.length);

    // =====================================================
    // GET USER'S MILK ENTRIES
    // =====================================================

    const milkEntries = await MilkEntry.find({
      userId: req.user._id,
    })
      .populate("customerId", "name milkType")
      .sort({ date: -1 });

    console.log("🥛 Milk entries found:", milkEntries.length);

    // =====================================================
    // PREPARE DATABASE DATA
    // =====================================================

    const customerData = customers.map((customer) => ({
      name: customer.name,
      phone: customer.phone,
      milkType: customer.milkType,
      status: customer.status,
    }));

    const milkData = milkEntries.map((entry) => ({
      customerName: entry.customerId?.name,
      date: entry.date,
      morningMilk: entry.morningMilk,
      eveningMilk: entry.eveningMilk,
      totalMilk: entry.totalMilk,
    }));

    console.log("🤖 Sending voice + MongoDB data to Gemini...");

    // =====================================================
    // SEND AUDIO + DATABASE DATA TO GEMINI
    // =====================================================

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",

      contents: [
        {
          text: `
You are a Dairy Management Assistant.

First, listen carefully to the audio and understand exactly what
the user is asking.

Then answer the user's question using ONLY the real dairy data
provided below.

IMPORTANT RULES:

1. Do not invent any information.
2. Do not guess if the audio is unclear.
3. If you cannot clearly understand the user's question,
   respond:
   "I couldn't clearly understand your question. Please try again."
4. If the requested customer does not exist, say that the customer
   was not found.
5. If the requested milk information is not available, clearly say
   that the information is not available.
6. Use the milk entries to calculate totals when necessary.
7. Do not reveal MongoDB IDs.
8. Do not mention JSON, database queries, or internal implementation.
9. Answer directly and simply.
10. Do not say "The user asked..." or "The audio says..."
11. If the user asks about a customer's milk, use the customer's
    actual milk entries below.

CUSTOMERS:
${JSON.stringify(customerData, null, 2)}

MILK ENTRIES:
${JSON.stringify(milkData, null, 2)}
          `,
        },

        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audio,
          },
        },
      ],
    });

    console.log("✅ Gemini responded");

    console.log("🤖 AI answer:", response.text);

    res.json({
      success: true,
      answer: response.text,
    });

  } catch (error) {
    console.error("❌ Voice AI Error:", error);

    res.status(500).json({
      success: false,
      message: "Voice AI request failed",
      error: error.message,
    });
  }
});

// =====================================================
// MILK SUMMARY
// =====================================================

router.post("/milk-summary", protect, async (req, res) => {
  try {

    const {
      customerName,
      month,
      year,
    } = req.body;

    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const currentDate = new Date();

    const selectedMonth =
      month !== undefined
        ? Number(month)
        : currentDate.getMonth();

    const selectedYear =
      year !== undefined
        ? Number(year)
        : currentDate.getFullYear();


    // ==========================================
    // FIND CUSTOMER
    // ==========================================

    const customer = await Customer.findOne({
      userId: req.user._id,

      name: {
        $regex: new RegExp(
          `^${customerName.trim()}$`,
          "i"
        ),
      },
    });


    if (!customer) {

      return res.status(404).json({
        success: false,
        message: `Customer "${customerName}" not found`,
      });

    }


    // ==========================================
    // DATE RANGE
    // ==========================================

    const startDate = new Date(
      selectedYear,
      selectedMonth,
      1
    );

    const endDate = new Date(
      selectedYear,
      selectedMonth + 1,
      1
    );


    console.log("📅 Start:", startDate);
    console.log("📅 End:", endDate);


    // ==========================================
    // FIND MILK ENTRIES
    // ==========================================

    const milkEntries = await MilkEntry.find({

      userId: req.user._id,

      customerId: customer._id,

      date: {
        $gte: startDate,
        $lt: endDate,
      },

    }).sort({
      date: 1,
    });


    // ==========================================
    // CALCULATE TOTAL
    // ==========================================

    const totalMilk = milkEntries.reduce(
      (total, entry) => {

        return total +
          Number(entry.totalMilk || 0);

      },
      0
    );


    console.log(
      `🥛 ${customer.name} total milk:`,
      totalMilk
    );


    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({

      success: true,

      customer: {
        id: customer._id,
        name: customer.name,
        milkType: customer.milkType,
      },

      month: selectedMonth + 1,

      year: selectedYear,

      totalMilk,

      numberOfEntries:
        milkEntries.length,

    });


  } catch (error) {

    console.error(
      "❌ Milk Summary Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Could not calculate milk summary",
    });

  }
});


module.exports = router;