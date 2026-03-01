require("dotenv").config();
const express = require("express");
const cors = require("cors");

const animationRoutes = require("./routes/animation");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/animation", animationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));