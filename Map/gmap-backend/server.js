// server.js
const dotenv = require("dotenv");
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
dotenv.config();

const app = express();
app.use(cors());

app.get('/api/spots', (req, res) => {
  const sql = 'SELECT id, lat, lng,place FROM marked_spots';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
