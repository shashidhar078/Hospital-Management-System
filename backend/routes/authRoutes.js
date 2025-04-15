const express = require("express");
const crypto = require("crypto");
const User = require("../models/userModel"); // Your User model
const sendEmail = require("../utils/sendEmail"); // Import the function
const bcrypt=require("bcryptjs");
const router = express.Router();

// Request Password Reset (Forgot Password)
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1-hour expiration

        await user.save();

        // Construct password reset URL
        const resetLink = `http://localhost:5000/api/auth/reset-password/${resetToken}`;
        sendEmail(
            user.email,
            "Password Reset Request",
            `Click the link below to reset your password:\n${resetLink}`
        );
        
        if (email) {
            res.json({ message: "Password reset link sent to your email." });
        } else {
            res.status(500).json({ message: "Failed to send email. Try again later." });
        }
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // Find user by token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash the new password
        user.password = newPassword;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        console.log("User before saving:", user);
        await user.save();
        console.log("User after saving:", await User.findById(user._id));


        res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
