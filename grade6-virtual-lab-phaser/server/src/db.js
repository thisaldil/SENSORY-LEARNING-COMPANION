import mongoose from "mongoose";

export async function connectDB(uri) {
  // if the caller didn't pass a URI, use the environment variable or fall back
  // to localhost.  this prevents the common "uri undefined" runtime error
  // when someone forgets to copy `.env.example`.
  const connectionString =
    uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/grade6_virtual_lab_phaser";

  if (typeof connectionString !== "string" || connectionString.length === 0) {
    throw new Error("MongoDB URI must be a non-empty string");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(connectionString);
  console.log(`✅ MongoDB connected (${connectionString})`);
}
