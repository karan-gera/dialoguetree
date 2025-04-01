const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add a specific route for the JSON file
app.get("/alessandro1.json", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "public", "alessandro1.json");
    console.log("Attempting to read file from:", filePath);
    const data = await fs.readFile(filePath, "utf8");
    console.log("File read successfully");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading JSON file:", error);
    res.status(500).json({ error: "Failed to read dialogue file" });
  }
});

app.post("/api/save-dialogue", async (req, res) => {
  try {
    const dialogueData = req.body;
    const filePath = path.join(__dirname, "public", "alessandro1.json");
    console.log("Saving to file:", filePath);
    await fs.writeFile(filePath, JSON.stringify(dialogueData, null, 2));
    console.log("File saved successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving dialogue:", error);
    res.status(500).json({ error: "Failed to save dialogue" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, "public")}`);
});
