import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ===============================
   REGISTER NEW USER
=============================== */
router.post("/register", async (req, res) => {
  try {
    const { username, password, role, fullname, email, phone, age } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const user = new User({
      username,
      password: hashedPassword,
      role,
      fullname,
      email,
      phone,
      age,
    });

    await user.save();

    res.json({ message: "✅ User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   LOGIN USER
=============================== */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user in DB
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Sign JWT with real role from DB
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Respond with token and user info
    res.json({
      token,
      user: {  
        _id: user._id,
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        age: user.age,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   GET ALL USERS (OPTIONAL FILTER)
=============================== */
router.get("/users", async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   GET USER BY ID
=============================== */
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   UPDATE USER BY ID
=============================== */
router.put("/users/:id", async (req, res) => {
  try {
    const { username, password, role, fullname, email, phone, age } = req.body;

    const updateData = { username, role, fullname, email, phone, age };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   CHANGE PASSWORD
=============================== */
router.patch("/users/:id/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Both currentPassword and newPassword are required",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "✅ Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   DELETE USER
=============================== */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
