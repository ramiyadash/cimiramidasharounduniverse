const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const chatRoutes = require("./routes/chat.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/chat", chatRoutes);

app.use(errorMiddleware);

module.exports = app;