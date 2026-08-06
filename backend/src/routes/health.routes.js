const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "Dash Around Universe Backend"
  });
});

module.exports = router;