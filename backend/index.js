const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/api/items", (req, res) => {
  res.json([{ id: 1, name: "Item 1" }, { id: 2, name: "Item 2" }]);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
