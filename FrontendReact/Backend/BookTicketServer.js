//BookTicketServer.js
import express from 'express';
import db from './db.js';

const router = express.Router();

// Helper function to combine date and time
function combineDateTime(date, time) {
  return `${date} ${time}:00`;
}

router.post('/book-ticket', async (req, res) => {
  let connection;
  try {
    const {
      carNumber,
      license,
      driverName,
      customerPhone,
      ownerName,
      ownerPhone,
      date,
      startTime,
      endTime,
      spotName,
      userEmail
    } = req.body;

    // Validate required fields
    if (!carNumber || !date || !startTime || !endTime || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    connection = await db.getConnection();

    // Combine date and time
    const startDateTime = combineDateTime(date, startTime);
    const endDateTime = combineDateTime(date, endTime);

    // First check if the spot exists
    const [spot] = await connection.query(
      'SELECT id FROM marked_spots WHERE place = ? LIMIT 1',
      [spotName]
    );

    if (!spot.length) {
      return res.status(400).json({ error: 'Parking spot not found' });
    }

    const spotId = spot[0].id;

    // Check for overlapping bookings
    const [existingBookings] = await connection.query(
      `SELECT * FROM ticket_info 
       WHERE spotId = ? AND date = ?
       AND (
         (start_time < ? AND end_time > ?) OR
         (start_time >= ? AND start_time < ?)
       )`,
      [spotId, date, endDateTime, startDateTime, startDateTime, endDateTime]
    );

    if (existingBookings.length > 0) {
      return res.status(400).json({ 
        error: 'This spot is already booked for the selected time' 
      });
    }

    // Insert the booking
    const [result] = await connection.query(
      `INSERT INTO ticket_info (
        car_number, license, driving_person_name, customer_phnNo,
        car_owner_name, owner_phnNo, date, start_time, end_time,
        spot_name, spotId, user_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        carNumber,
        license || null,
        driverName || null,
        customerPhone || null,
        ownerName || null,
        ownerPhone || null,
        date,
        startDateTime,
        endDateTime,
        spotName,
        spotId,
        userEmail
      ]
    );

    res.status(200).json({ 
      success: true,
      slotId: result.insertId,
      message: 'Booking successful'
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Booking failed',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;