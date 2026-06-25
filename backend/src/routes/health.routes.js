const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "TripMate AI Backend"
  });
});

module.exports = router;