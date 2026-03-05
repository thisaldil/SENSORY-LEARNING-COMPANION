import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import { makeCors } from "./cors.js";

import labsRoutes from "./routes/labs.routes.js";
import resultsRoutes from "./routes/results.routes.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));
// if the user hasn't set CORS_ORIGIN we allow any origin in dev
app.use(makeCors(process.env.CORS_ORIGIN));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/labs", labsRoutes);
app.use("/api/results", resultsRoutes);

let PORT = Number(process.env.PORT) || 4000;

async function startServer(port) {
  try {
    const server = await new Promise((resolve, reject) => {
      const s = app.listen(port, () => resolve(s));
      s.on("error", reject);
    });

    const actual = server.address();
    const usedPort = typeof actual === "object" ? actual.port : port;
    console.log(`✅ Server running http://localhost:${usedPort}`);
    return usedPort;
  } catch (err) {
    if (err.code === "EADDRINUSE") {
      console.warn(`port ${port} in use, trying ${port + 1}`);
      return startServer(port + 1);
    }
    throw err;
  }
}

try {
  await connectDB(process.env.MONGODB_URI);
} catch (err) {
  console.error("Failed to connect to MongoDB:", err.message || err);
  process.exit(1);
}

// global error handler – any uncaught exception from routes will be logged and a
// 500 response sent. keeps the server from crashing and provides nicer output
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

startServer(PORT).catch((err) => {
  console.error("Unable to start server:", err);
  process.exit(1);
});
