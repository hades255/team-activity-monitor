const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Serve the client application
router.get("/client", (req, res) => {
  const clientPath = path.join(
    __dirname,
    "../../client/dist/TeamActivityMonitor.zip"
  );

  // Check if file exists
  if (!fs.existsSync(clientPath)) {
    return res.status(404).json({ error: "Client application not found" });
  }

  // Set headers for file download
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=TeamActivityMonitor.zip"
  );

  // Stream the file
  const fileStream = fs.createReadStream(clientPath);
  fileStream.pipe(res);
});

module.exports = router;
