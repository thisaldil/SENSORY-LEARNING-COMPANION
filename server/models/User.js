import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"], default: "user" },
  // user-specific fields
  fullname: { type: String },
  email: { type: String },
  phone: { type: String },
  age: { type: String },
});

export default mongoose.model("User", userSchema);
