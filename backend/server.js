const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "TripMate AI Backend"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen3",
        prompt: `
You are TripMate AI, a helpful travel planning assistant.

User message:
${message}

Give a practical, friendly travel-planning response.
        `,
        stream: false
      })
    });

    const data = await ollamaResponse.json();

    res.json({
      reply: data.response
    });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({
      error: "Failed to get response from AI model"
    });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`TripMate AI backend running on http://localhost:${PORT}`);
});
