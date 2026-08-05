const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User Registered Successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};




// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};


 const forgotPassword = async (req, res) => {
  try {
    console.log("🔵 Forgot password request received");

    const { email } = req.body;

    console.log("📧 Email received:", email);

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Find user
    console.log("🔎 Searching user...");

    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ User not found");

      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log("✅ User found:", user.email);

    // Prevent multiple reset emails
if (
  user.resetPasswordToken &&
  user.resetPasswordExpire &&
  user.resetPasswordExpire > Date.now()
) {
  return res.status(429).json({
    message:
      "A password reset link has already been sent. Please check your email.",
  });
}

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    console.log("🔑 Reset token generated");

    // Save token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    console.log("💾 Saving reset token...");

    await user.save();

    console.log("✅ Reset token saved");

    // Reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    console.log("🔗 Reset URL:", resetUrl);

    const message = `
      <h2>Password Reset</h2>
      <p>You requested to reset your password.</p>
      <a href="${resetUrl}">Click here to reset your password</a>
      <p>This link expires in 15 minutes.</p>
    `;

    console.log("📨 Sending email...");

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    console.log("✅ Email sent successfully");

    res.status(200).json({
      message: "Password reset link sent to your email",
    });

  } catch (error) {
    console.error("❌ FORGOT PASSWORD ERROR:");
    console.error(error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


//reset
const resetPassword = async (req, res) => {
  try {

    const { token } = req.params;
    const { password } = req.body;


    if (!password) {
      return res.status(400).json({
        message: "Password is required"
      });
    }


    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: {
        $gt: Date.now()
      }
    });


    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }


    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);


    user.password = hashedPassword;


    // Remove reset token after use
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;


    await user.save();


    res.status(200).json({
      message: "Password reset successfully"
    });


  } catch(error){

    console.log(error);

    res.status(500).json({
      message:"Server Error"
    });

  }
};
module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
