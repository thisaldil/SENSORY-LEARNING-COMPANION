import cors from "cors";

export function makeCors(origin) {
  // when no origin is provided (e.g. running locally without .env) allow
  // everything – `true` tells `cors` to reflect the request origin.
  const corsOptions = {
    origin: origin || true,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  };
  return cors(corsOptions);
}
