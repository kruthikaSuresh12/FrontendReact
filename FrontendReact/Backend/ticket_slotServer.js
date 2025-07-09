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
    amountPerHour,
    latitude,
    longitude
  } = req.body;

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
    amountPerHour
  ], (err, result) => {
    if (err) {
      console.error('❌ SQL Insert Error:', err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }

    // 🆕 Insert into marked_spots
    const insertMapQuery = `
      INSERT INTO marked_spots (lat, lng, place, amount_per_hour)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertMapQuery, [latitude, longitude, companyName, amountPerHour], (err, mapResult) => {
      if (err) {
        console.error('❌ Error inserting into marked_spots:', err.sqlMessage);
        return res.status(500).json({ error: 'Map data insertion failed' });
      }

      // ✅ Create slot table for company
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

          res.status(200).json({ message: 'Parking place, map location, and slots created successfully' });
        });
      });
    });
  });
});


export default router;
