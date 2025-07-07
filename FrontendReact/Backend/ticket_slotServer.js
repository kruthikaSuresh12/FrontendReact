import express from 'express';
import db from './db.js';
import bodyParser from 'body-parser';

const router = express.Router();
router.use(bodyParser.json());

router.post('/submit-parking-info', (req, res) => {
  const {
    companyName,
    areaLicense,
    ownerName,
    ownerGmail,
    companyEmail,
    address,
    ownerPhone,
    workPhone,
    totalSlots,
    amountPerHour // 🆕 New field
  } = req.body;

  // Step 1: Insert into parking_place_side (now with amountPerHour)
  const insertQuery = `
    INSERT INTO parking_place_side 
    (company_name, area_license_numb, company_email, address, owner_phnNo, work_phnNo, owner_name, owner_gmail, total_slots, amount_per_hour)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertQuery, [
    companyName,
    areaLicense,
    companyEmail,
    address,
    ownerPhone,
    workPhone,
    ownerName,
    ownerGmail,
    totalSlots,
    amountPerHour // 🆕 Send value to DB
  ], (err, result) => {
    if (err) {
      console.error('❌ SQL Insert Error:', err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }

    // Step 2: Create company slot table
    const tableName = companyName.replace(/\s+/g, '_').toLowerCase();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        slotId VARCHAR(10) PRIMARY KEY,
        status VARCHAR(10) DEFAULT 'empty'
      )
    `;

    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Error creating slot table:', err);
        return res.status(500).json({ error: 'Table creation failed' });
      }

      // Step 3: Insert empty slot rows
      const values = [];
      for (let i = 1; i <= totalSlots; i++) {
        const id = 'T' + i.toString().padStart(3, '0');
        values.push([id]);
      }

      const insertSlotsQuery = `INSERT INTO \`${tableName}\` (slotId) VALUES ?`;
      db.query(insertSlotsQuery, [values], (err, result) => {
        if (err) {
          console.error('Error inserting slots:', err);
          return res.status(500).json({ error: 'Slot insertion failed' });
        }

        res.status(200).json({ message: 'Parking place and slots created successfully' });
      });
    });
  });
});

export default router;
