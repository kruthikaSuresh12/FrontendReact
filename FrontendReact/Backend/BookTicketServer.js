import express from 'express';
import db from './db.js';

const router = express.Router();

function combineDateAndTime(date, time) {
  return `${date} ${time}:00`;
}

function sanitizeTableName(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

router.post('/book-ticket', async (req, res) => {
  const {
    carNumber,
    license,
    startTime,
    endTime,
    driverName,
    customerPhone,
    date,
    ownerName,
    ownerPhone,
    spotName
  } = req.body;

  const startDateTime = combineDateAndTime(date, startTime);
  const endDateTime = combineDateAndTime(date, endTime);
  const tableName = sanitizeTableName(spotName);

  try {
    // Step 1: Check for any empty slot
    const [emptySlots] = await db.promise().query(`SELECT slotId FROM \`${tableName}\` WHERE status = 'empty'`);

    if (emptySlots.length > 0) {
      const slotId = emptySlots[0].slotId;

      // Insert into ticket_info
      await db.promise().query(
        `INSERT INTO ticket_info (
          car_number, license, spot_name, spotId, driving_person_name,
          customer_phnNo, car_owner_name, owner_phnNo,
          date, start_time, end_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          carNumber, license, spotName, slotId, driverName,
          customerPhone, ownerName, ownerPhone,
          date, startDateTime, endDateTime
        ]
      );

      // Mark that slot as booked
      await db.promise().query(`UPDATE \`${tableName}\` SET status = 'booked' WHERE slotId = ?`, [slotId]);

      return res.status(200).json({ message: "Ticket booked", slotId });

    }

    // Step 2: If no empty slots, check for reusable (non-overlapping) slots
    const [allSlots] = await db.promise().query(`SELECT slotId FROM \`${tableName}\``);

    for (const slot of allSlots) {
      const slotId = slot.slotId;

      const [overlaps] = await db.promise().query(
        `SELECT * FROM ticket_info 
         WHERE spot_name = ? AND spotId = ? AND date = ? 
         AND (
           (start_time < ? AND end_time > ?) OR
           (start_time >= ? AND start_time < ?)
         )`,
        [spotName, slotId, date, endDateTime, startDateTime, startDateTime, endDateTime]
      );

      if (overlaps.length === 0) {
        // Assign reusable slot
        await db.promise().query(
          `INSERT INTO ticket_info (
            car_number, license, spot_name, spotId, driving_person_name,
            customer_phnNo, car_owner_name, owner_phnNo,
            date, start_time, end_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            carNumber, license, spotName, slotId, driverName,
            customerPhone, ownerName, ownerPhone,
            date, startDateTime, endDateTime
          ]
        );

        return res.status(200).json({ message: "Ticket booked", slotId });

      }
    }

    // Step 3: No available slot found
    return res.status(400).json({ message: "No available slot for the selected time" });

  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ error: "Server error during booking" });
  }
});

export default router;