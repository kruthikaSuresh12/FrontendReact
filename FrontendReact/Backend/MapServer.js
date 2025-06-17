import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import db from "./db.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/spots', (req, res) => {
  const sql = 'SELECT id, lat, lng,place FROM marked_spots';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});