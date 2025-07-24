import express from 'express';
import db from './db.js';
import bodyParser from 'body-parser';

const router = express.Router();
router.use(bodyParser.json());

router.post('/submit-parking-info', async (req, res) => {
  let connection;
  try {
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

    // Input validation
    if (!companyName || !areaLicense || !ownerName || !ownerGmail || 
        !companyEmail || !address || !ownerPhone || !workPhone || 
        !totalSlots || !amountPerHour || !latitude || !longitude) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get connection from pool
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into parking_place_side
      const [parkingResult] = await connection.query(
        `INSERT INTO parking_place_side 
         (company_name, area_license_numb, company_email, address, 
          owner_phnNo, work_phnNo, owner_name, owner_gmail, 
          total_slots, amount_per_hour)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );

      // Insert into marked_spots
      await connection.query(
        `INSERT INTO marked_spots (lat, lng, place, amount_per_hour)
         VALUES (?, ?, ?, ?)`,
        [latitude, longitude, companyName, amountPerHour]
      );

      // Create slot table for company
      const tableName = companyName.replace(/\s+/g, '_').toLowerCase();
      await connection.query(
        `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          slotId VARCHAR(10) PRIMARY KEY,
          status VARCHAR(10) DEFAULT 'empty'
        )`
      );

      // Insert slots
      const values = Array.from({ length: totalSlots }, (_, i) => 
        [`T${(i + 1).toString().padStart(3, '0')}`]
      );
      
      if (values.length > 0) {
        await connection.query(
          `INSERT INTO \`${tableName}\` (slotId) VALUES ?`,
          [values]
        );
      }

      await connection.commit();
      res.status(200).json({ 
        success: true,
        message: 'Parking place created successfully' 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: error.message 
    });
  }
});

export default router;