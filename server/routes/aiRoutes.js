const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { GoogleGenAI } = require("@google/genai");

const Customer = require("../models/Customer");
const MilkEntry = require("../models/MilkEntry");


// =====================================================
// GEMINI
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// =====================================================
// TEXT AI / CHAT
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

    const userQuestion = question.trim();
    const lowerQuestion = userQuestion.toLowerCase();

    console.log("❓ Question:", userQuestion);


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
    // 1. WHO ARE MY CUSTOMERS?
    // =====================================================

    if (
      lowerQuestion.includes("who are my customers") ||
      lowerQuestion.includes("list my customers") ||
      lowerQuestion.includes("show my customers") ||
      lowerQuestion.includes("my customer list")
    ) {
      if (customers.length === 0) {
        return res.json({
          success: true,
          answer: "You currently have no customers.",
        });
      }

      const customerList = customers
        .map(
          (customer, index) =>
            `${index + 1}. ${customer.name} (${customer.milkType})`
        )
        .join("\n");

      return res.json({
        success: true,
        answer: `You currently have ${customers.length} customers:\n${customerList}`,
      });
    }


    // =====================================================
    // 2. HOW MANY CUSTOMERS?
    // =====================================================

    if (
      lowerQuestion.includes("how many customers") ||
      lowerQuestion.includes("number of customers") ||
      lowerQuestion.includes("total customers") ||
      lowerQuestion.includes("count of customers")
    ) {
      return res.json({
        success: true,
        answer: `You currently have ${customers.length} customers.`,
      });
    }


    // =====================================================
    // 3. CALCULATE TOTAL MILK FOR EACH CUSTOMER
    // =====================================================

    const customerMilkTotals = {};

    customers.forEach((customer) => {
      customerMilkTotals[customer._id.toString()] = {
        name: customer.name,
        milkType: customer.milkType,
        totalMilk: 0,
        entryCount: 0,
      };
    });


    milkEntries.forEach((entry) => {
      if (!entry.customerId) return;

      const customerId = entry.customerId._id.toString();

      if (customerMilkTotals[customerId]) {
        customerMilkTotals[customerId].totalMilk += Number(
          entry.totalMilk || 0
        );

        customerMilkTotals[customerId].entryCount += 1;
      }
    });


    const milkTotals = Object.values(customerMilkTotals);


    // =====================================================
    // CUSTOMERS WHO ACTUALLY HAVE MILK ENTRIES
    // =====================================================

    const customersWithMilk = milkTotals.filter(
      (customer) => customer.entryCount > 0
    );


    // =====================================================
    // 4. WHO BUYS THE LEAST MILK?
    // =====================================================

    if (
      lowerQuestion.includes("least milk") ||
      lowerQuestion.includes("less milk") ||
      lowerQuestion.includes("buys the least") ||
      lowerQuestion.includes("buys less") ||
      lowerQuestion.includes("lowest quantity") ||
      lowerQuestion.includes("least quantity") ||
      lowerQuestion.includes("less quantity") ||
      lowerQuestion.includes("lowest milk")
    ) {
      if (customersWithMilk.length === 0) {
        return res.json({
          success: true,
          answer: "There is no milk purchase data available.",
        });
      }

      const customerWithLeastMilk = customersWithMilk.reduce(
        (least, customer) => {
          return customer.totalMilk < least.totalMilk
            ? customer
            : least;
        }
      );

      return res.json({
        success: true,
        answer: `${customerWithLeastMilk.name} buys the least milk, with a total of ${customerWithLeastMilk.totalMilk} litres.`,
      });
    }


    // =====================================================
    // 5. WHO BUYS THE MOST MILK?
    // =====================================================

    if (
      lowerQuestion.includes("most milk") ||
      lowerQuestion.includes("buys the most") ||
      lowerQuestion.includes("highest quantity") ||
      lowerQuestion.includes("maximum milk") ||
      lowerQuestion.includes("highest milk")
    ) {
      if (customersWithMilk.length === 0) {
        return res.json({
          success: true,
          answer: "There is no milk purchase data available.",
        });
      }

      const customerWithMostMilk = customersWithMilk.reduce(
        (most, customer) => {
          return customer.totalMilk > most.totalMilk
            ? customer
            : most;
        }
      );

      return res.json({
        success: true,
        answer: `${customerWithMostMilk.name} buys the most milk, with a total of ${customerWithMostMilk.totalMilk} litres.`,
      });
    }


    // =====================================================
    // 6. CUSTOMER-SPECIFIC QUESTIONS
    // =====================================================

    const matchedCustomer = customers.find((customer) =>
      lowerQuestion.includes(customer.name.toLowerCase())
    );


    if (matchedCustomer) {

      const customerTotal = milkTotals.find(
        (customer) =>
          customer.name.toLowerCase() ===
          matchedCustomer.name.toLowerCase()
      );


      // -----------------------------------------------
      // CUSTOMER MILK QUESTION
      // -----------------------------------------------

      if (
        lowerQuestion.includes("milk") ||
        lowerQuestion.includes("quantity") ||
        lowerQuestion.includes("litre") ||
        lowerQuestion.includes("liter") ||
        lowerQuestion.includes("buy") ||
        lowerQuestion.includes("buys")
      ) {
        return res.json({
          success: true,
          answer: `${matchedCustomer.name} has purchased a total of ${
            customerTotal?.totalMilk || 0
          } litres of milk.`,
        });
      }


      // -----------------------------------------------
      // CUSTOMER NAME / EXISTENCE
      // -----------------------------------------------

      if (
        lowerQuestion.includes("customer") ||
        lowerQuestion.includes("name") ||
        lowerQuestion.includes("exist") ||
        lowerQuestion.includes("is")
      ) {
        return res.json({
          success: true,
          answer: `Yes, ${matchedCustomer.name} is one of your customers. They use ${matchedCustomer.milkType} milk.`,
        });
      }
    }


    // =====================================================
    // 7. PREPARE DATA FOR GEMINI
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


    console.log("🤖 Sending general question to Gemini...");


    // =====================================================
    // 8. GEMINI FOR GENERAL AI QUESTIONS
    // =====================================================

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",

      config: {
        systemInstruction: `
You are a helpful Dairy Management Assistant.

You have access to real data from the logged-in user's dairy management system.

IMPORTANT RULES:

1. Only use the information provided below.
2. Never invent customers, milk quantities, dates, prices, bills, or payments.
3. If the requested information is not available, clearly say so.
4. Answer the user's question directly and simply.
5. Do not reveal MongoDB IDs.
6. Do not mention JSON, database queries, or internal implementation.
7. Do not make up information.
8. If the user asks a general dairy-related question, provide a helpful answer.
9. If the user asks for customer or milk information, use only the provided data.

CUSTOMERS:
${JSON.stringify(customerData, null, 2)}

MILK ENTRIES:
${JSON.stringify(milkData, null, 2)}
        `,
      },

      contents: userQuestion,
    });


    console.log("🤖 Gemini answer:", response.text);


    return res.json({
      success: true,
      answer: response.text,
    });


  } catch (error) {

    console.error("❌ AI Error:", error);


    // =====================================================
    // GEMINI QUOTA ERROR
    // =====================================================

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "AI quota has been exceeded. Please try again later.",
      });
    }


    return res.status(500).json({
      success: false,
      message: "AI request failed",
      error: error.message,
    });
  }
});


// =====================================================
// VOICE AI
// =====================================================

router.post("/voice", protect, async (req, res) => {
  try {

    const { audio, mimeType } = req.body;


    // =====================================================
    // VALIDATE AUDIO
    // =====================================================

    if (!audio) {
      return res.status(400).json({
        success: false,
        message: "Audio is required",
      });
    }


    if (audio.length < 1000) {
      return res.status(400).json({
        success: false,
        message:
          "No clear voice was detected. Please speak your question.",
      });
    }


    console.log("🎤 Voice request received");
    console.log("👤 User:", req.user._id);
    console.log("Audio MIME type:", mimeType);
    console.log("Audio size:", audio.length);


    // =====================================================
    // GET CUSTOMERS
    // =====================================================

    const customers = await Customer.find({
      userId: req.user._id,
    }).select("name phone milkType status");


    console.log("👥 Customers found:", customers.length);


    // =====================================================
    // GET MILK ENTRIES
    // =====================================================

    const milkEntries = await MilkEntry.find({
      userId: req.user._id,
    })
      .populate("customerId", "name milkType")
      .sort({ date: -1 });


    console.log("🥛 Milk entries found:", milkEntries.length);


    // =====================================================
    // PREPARE DATA
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
    // SEND AUDIO TO GEMINI
    // =====================================================

    const response = await ai.models.generateContent({

      model: "gemini-3.1-flash-lite",

      contents: [

        {
          text: `
You are a Dairy Management Assistant.

First, listen carefully to the audio and understand exactly
what the user is asking.

Then answer the question using ONLY the real dairy data
provided below.

IMPORTANT RULES:

1. Do not invent information.
2. Do not guess if the audio is unclear.
3. If you cannot clearly understand the question, respond:

"I couldn't clearly understand your question. Please try again."

4. If the requested customer does not exist, say that the customer was not found.
5. If requested milk information is not available, clearly say so.
6. Use milk entries to calculate totals when necessary.
7. Do not reveal MongoDB IDs.
8. Do not mention JSON, database queries, or internal implementation.
9. Answer directly and simply.
10. Do not say "The user asked..."
11. If the user asks about a customer's milk, use the actual milk entries.
12. Do not invent customer information.

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


    return res.json({
      success: true,
      answer: response.text,
    });


  } catch (error) {

    console.error("❌ Voice AI Error:", error);


    // =====================================================
    // GEMINI QUOTA ERROR
    // =====================================================

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "AI quota has been exceeded. Please try again later.",
      });
    }


    return res.status(500).json({
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


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }


    // =====================================================
    // MONTH / YEAR
    // =====================================================

    const currentDate = new Date();


    const selectedMonth =
      month !== undefined
        ? Number(month)
        : currentDate.getMonth();


    const selectedYear =
      year !== undefined
        ? Number(year)
        : currentDate.getFullYear();


    // =====================================================
    // FIND CUSTOMER
    // =====================================================

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


    // =====================================================
    // DATE RANGE
    // =====================================================

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


    // =====================================================
    // FIND MILK ENTRIES
    // =====================================================

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


    // =====================================================
    // CALCULATE TOTAL
    // =====================================================

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


    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({

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


    return res.status(500).json({
      success: false,
      message: "Could not calculate milk summary",
    });

  }

});


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
