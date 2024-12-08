const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator"); // Validation library
const User = require("../../models/User");
const router = express.Router();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || "1h";

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post(
    "/register",
    [
        check("username", "Username is required").notEmpty(),
        check("email", "Valid email is required").isEmail(),
        check(
            "password",
            "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character."
        ).matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: "notok", errors: errors.array() });
        }

        const { username, email, password, role } = req.body;

        try {
            // Check if email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    status: "notokmail",
                    msg: "Email is already registered",
                });
            }

            // Create new user instance
            const newUser = new User({
                username,
                email,
                password, // Will be hashed below
                role: role || "user", // Default role is 'user'
            });

            // Hash the password securely
            const salt = await bcrypt.genSalt(12);
            newUser.password = await bcrypt.hash(password, salt);

            // Save user to database
            const savedUser = await newUser.save();

            // Generate JWT token
            const token = jwt.sign(
                { id: savedUser.id, role: savedUser.role },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRE }
            );

            // Return success response
            res.status(201).json({
                status: "ok",
                msg: "Registration successful",
                token,
                user: {
                    id: savedUser.id,
                    username: savedUser.username,
                    email: savedUser.email,
                    role: savedUser.role,
                },
            });
        } catch (err) {
            console.error("Server error:", err.message);
            res.status(500).json({
                status: "error",
                msg: "Internal server error. Please try again later.",
            });
        }
    }
);

// @route   POST api/users/login
// @desc    Authenticate user and get token
// @access  Public
router.post(
    "/login",
    [
        // Input validation using express-validator
        check("email", "A valid email is required").isEmail(),
        check("password", "Password is required").notEmpty(),
    ],
    async (req, res) => {
        // Validate inputs
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "notok",
                msg: "Invalid input",
                errors: errors.array(),
            });
        }

        const { email, password } = req.body;

        try {
            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                // Use a generic error message to avoid exposing if the email exists
                return res.status(401).json({
                    status: "notok",
                    msg: "Invalid email or password",
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                // Return the same generic error message
                return res.status(401).json({
                    status: "notok",
                    msg: "Invalid email or password",
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, role: user.role },
                JWT_SECRET,
                { expiresIn: TOKEN_EXPIRE }
            );

            // Return token and user data
            res.status(200).json({
                status: "ok",
                msg: "Login successful",
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (err) {
            console.error("Server error:", err.message);

            res.status(500).json({
                status: "error",
                msg: "Internal server error. Please try again later.",
            });
        }
    }
);


module.exports = router;
