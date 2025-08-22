//server.js
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import ticketSlotRoutes from './ticket_slotServer.js';
import bookTicketRoutes from './BookTicketServer.js';


dotenv.config();

const app = express();

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function generateToken(user) {
  return jwt.sign(
    { emailID: user.emailID },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Middleware setup
const corsOptions = {
  origin: "https://parkingsystem-iuq9.onrender.com",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors({
  origin: "https://parkingsystem-iuq9.onrender.com", 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(cookieParser());


// Token cleanup scheduler
setInterval(async () => {
  try {
    await db.query('DELETE FROM user_tokens WHERE expires_at < NOW()');
    console.log('Cleaned up expired tokens');
  } catch (err) {
    console.error('Token cleanup error:', err);
  }
}, 3600000); // Runs hourly

// Middleware to protect admin routes
const authenticateAdmin = (req, res, next) => {
  console.log('🔍 Request Cookies:', req.cookies);
  console.log('🔍 Authorization Header:', req.headers.authorization);
  console.log('🔍 Origin:', req.headers.origin);
  console.log('🔍 Host:', req.headers.host);

  let token = req.cookies.admin_token;

  if (!token) {
    console.log('❌ No admin_token cookie found');
    return res.status(401).json({ error: 'No admin token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.admin = decoded;
    console.log('✅ Admin verified:', decoded);
    next();
  } catch (err) {
    console.log('❌ Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

app.use('/api', ticketSlotRoutes);
app.use('/api', bookTicketRoutes);

// Enhanced authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Check for token in cookies first
    let token = req.cookies.token;
    
    // If not in cookies, check Authorization header
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    console.log('Cookies:', req.cookies);
    console.log('Auth Header:', req.headers.authorization);

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const emailID = decoded.emailID;

    // Check if token exists in database
    const [tokens] = await db.query(
      'SELECT * FROM user_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (!tokens.length) {
      throw new Error('Invalid or expired token');
    }

    // Get user data
    const [users] = await db.query(
      'SELECT * FROM login WHERE emailID = ?', 
      [decoded.emailID]
    );

    if (!users.length) {
      throw new Error('User not found');
    }

    req.user = users[0];
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ error: 'Unauthorized - Invalid session' });
  }
};

app.post('/api/admin-login', async (req, res) => {
  const { username, password } = req.body;

  // Hardcoded admin credentials (you can move to DB later)
  if (username === 'webadddel' && password === 'adddel321') {
    const token = jwt.sign(
      { role: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
      sameSite: 'lax',
      path: '/'
    });

    return res.json({ success: true, message: 'Login successful' });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});


// ====== 🔐 ADMIN LOGIN (Hardcoded) ======
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'webadddel' && password === 'adddel123') {
    const token = jwt.sign(
      { role: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('admin_token', token, {
     httpOnly: true,
      secure: true,           
      sameSite: 'lax',       
      maxAge: 3600000,  
      path: '/'   
    });

    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// ====== 🟢 SPOT OWNER LOGIN ======
app.post('/api/owner/login', async (req, res) => {
  const { username, spotName, password } = req.body;

  const [rows] = await db.query('SELECT * FROM spot_owners WHERE username = ?', [username]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const owner = rows[0];
  const isMatch = await bcrypt.compare(password, owner.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // ✅ Generate JWT
  const token = jwt.sign(
    { role: 'owner', spotName: owner.spot_name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // ✅ Send token in response
  res.json({ success: true, token });
});

// ====== 🔵 SPOT OWNER SIGNUP ======
app.post('/api/owner/signup', async (req, res) => {
  const { username, password, confirmPassword, spotName } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Check if username exists
  const [existing] = await db.query('SELECT * FROM spot_owners WHERE username = ?', [username]);
  if (existing.length) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.query(
    'INSERT INTO spot_owners (username, password, spot_name) VALUES (?, ?, ?)',
    [username, hashedPassword, spotName]
  );

  res.json({ success: true, message: 'Signup successful!' });
});

app.get('/api/owner/slots/:spotName', async (req, res) => {
  const { spotName } = req.params;

  // ✅ Convert spaces to underscores and lowercase
  const tableName = spotName.toLowerCase().replace(/\s+/g, '_');

  console.log('Fetching from table:', tableName); // 🔍 Debug

  try {
    const [results] = await db.query(`SELECT * FROM \`${tableName}\``);
    res.json(results);
  } catch (err) {
    console.error('Table not found:', tableName);
    return res.status(404).json({ error: 'Spot not found' });
  }
});

app.post('/api/owner/see-slot', async (req, res) => {
  const { spotName, slotId } = req.body;

  if (!spotName || !slotId) {
    return res.status(400).json({ error: 'Missing spotName or slotId' });
  }

  const tableName = spotName.toLowerCase().replace(/\s+/g, '_');

  try {
    // 1. Check if slot exists in spot table (e.g., rampura)
    const [slots] = await db.query(
      `SELECT * FROM \`${tableName}\` WHERE slotId = ?`,
      [slotId]
    );

    if (slots.length === 0) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    const slot = slots[0];

    let ticket = null;

    // 2. Check if there's a ticket for this slot
    // 🔽 Use correct column name: probably 'spotId' or 'slotId'
    const [tickets] = await db.query(
      `SELECT car_number, driving_person_name, customer_phnNo, date, start_time, end_time 
       FROM ticket_info 
       WHERE spot_name = ? AND spotId = ?`,
      [spotName, slotId]
    );

    if (tickets.length > 0) {
      ticket = tickets[0];
    }

    res.json({ slot, ticket });
  } catch (err) {
    console.error('See slot error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/owner/book', async (req, res) => {
  const { spotName, slotId, carNumber, driverName, customerPhone, startTime, endTime } = req.body;

  // ✅ Normalize table and spot_name
  const tableName = spotName.toLowerCase().replace(/\s+/g, '_');
  const normalizedSpotName = tableName; // Use same clean name
  const today = new Date().toISOString().split('T')[0];
  const fullStartTime = `${today} ${startTime}:00`;
  const fullEndTime = `${today} ${endTime}:00`;

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [slots] = await connection.query(
      `SELECT * FROM \`${tableName}\` WHERE slotId = ? AND status = 'empty'`,
      [slotId]
    );

    if (slots.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Slot not available' });
    }

    await connection.query(
      `UPDATE \`${tableName}\` SET status = 'booked' WHERE slotId = ?`,
      [slotId]
    );

    await connection.query(
      `INSERT INTO ticket_info 
       (car_number, license, driving_person_name, customer_phnNo, 
        car_owner_name, owner_phnNo, date, start_time, end_time, spot_name, spotId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        carNumber,
        null,
        driverName,
        customerPhone,
        null,
        null,
        today,
        fullStartTime,
        fullEndTime,
        normalizedSpotName, // ✅ Use clean name
        slotId
      ]
    );

    await connection.commit();
    res.json({ success: true, message: 'Booked successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to book slot' });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/owner/delete-slot', async (req, res) => {
  const { spotName, slotId } = req.body;

  // Validate input
  if (!spotName || !slotId) {
    return res.status(400).json({ error: 'Missing spotName or slotId' });
  }

  const tableName = spotName.toLowerCase().replace(/\s+/g, '_');

  try {
    // Update the slot to 'empty'
    const [result] = await db.query(
      `UPDATE \`${tableName}\` SET status = 'empty' WHERE slotId = ?`,
      [slotId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slot not found or already empty' });
    }

    res.json({ success: true, message: `Slot ${slotId} marked as empty` });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/owner/see-slot/:spotName/:slotId', async (req, res) => {
  const { spotName, slotId } = req.params;

  // Check slot status
  const checkSlotQuery = `SELECT * FROM \`${spotName}\` WHERE slotId = ?`;
  const [slotStatus] = await db.query(checkSlotQuery, [slotId]);

  if (!slotStatus.length) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  const slot = slotStatus[0];

  // If booked, fetch ticket details
  if (slot.status === 'booked') {
    const getTicketQuery = `SELECT * FROM ticket_info WHERE spot_name = ? AND slotId = ?`;
    const [ticketDetails] = await db.query(getTicketQuery, [spotName, slotId]);
    return res.json({ slot, ticket: ticketDetails[0] });
  }

  res.json({ slot });
});

app.get('/api/owner/tickets', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'owner') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // ✅ Use normalized spotName
    const spotName = decoded.spotName.toLowerCase().replace(/\s+/g, '_');

    const [tickets] = await db.query(
      'SELECT * FROM ticket_info WHERE spot_name = ? ORDER BY date DESC, start_time DESC LIMIT 10',
      [spotName]
    );

    res.json(tickets);
  } catch (err) {
    console.error('Fetch tickets error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { name, age, emailID, mobNo, password, confirm_password, gender } = req.body;
    
    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Password and confirmation do not match'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert user
      const [result] = await connection.query(
        `INSERT INTO login 
         (name, age, emailID, mobNo, password, gender) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, age, emailID, mobNo, hashedPassword, gender]
      );

      const newUser = {
        id: result.insertId,
        name,
        age,
        emailID,
        mobNo,
        gender
      };

      // Generate token
      const token = generateToken(newUser);
      const expiresAt = new Date(Date.now() + 3600000);

      await connection.query(
        `INSERT INTO user_tokens 
         (emailID, token_type, token, expires_at)
         VALUES (?, 'auth', ?, ?)`,
        [emailID, token, expiresAt]
      );

      await connection.commit();

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 3600000,
        sameSite: 'none',
        path: '/'
      });

      return res.status(201).json({
        success: true,
        user: newUser,
        token: token
      });

    } catch (err) {
      await connection.rollback();
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Email address already registered'
        });
      }
      
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Account creation failed'
    });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { emailID, password } = req.body;
    
    const [users] = await db.query(
      'SELECT * FROM login WHERE emailID = ?', 
      [emailID]
    );
    
    if (!users.length) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);
    const expiresAt = new Date(Date.now() + 3600000);

    await db.query(
      `INSERT INTO user_tokens 
       (emailID, token_type, token, expires_at)
       VALUES (?, 'auth', ?, ?)`,
      [emailID, token, expiresAt]
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'none',
      path: '/'
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        emailID: user.emailID,
        age: user.age,
        mobNo: user.mobNo,
        gender: user.gender
      },
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Parking Spots Endpoint
app.get('/api/spots', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, lat, lng, place, amount_per_hour FROM marked_spots');
    res.json(results);
  } catch (error) {
    console.error('Error fetching spots:', error);
    res.status(500).json({ error: 'Failed to fetch parking spots' });
  }
});


// Book Ticket Endpoint

app.get('/api/user-tickets', authenticate, async (req, res) => {
  try {
    const userEmail = req.user.emailID; 
    const [tickets] = await db.query(
      `SELECT * FROM ticket_info 
       WHERE user_email = ? 
         AND (date > CURDATE() OR 
              (date = CURDATE() AND end_time >= CURRENT_TIME())) 
       ORDER BY date DESC, start_time DESC`,
      [userEmail]
    );
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ 
      error: 'Failed to fetch tickets',
      details: err.message 
    });
  }
});

// app.post('/api/book-ticket', authenticate, async (req, res) => {
//   try {
//     const {
//       carNumber,
//       license,
//       startTime,
//       endTime,
//       driverName,
//       customerPhone,
//       date,
//       ownerName,
//       ownerPhone,
//       spotName,
//       spotId
//     } = req.body;

//     const userEmail = req.user.emailID;

//     const startDateTime = `${date} ${startTime}:00`;
//     const endDateTime = `${date} ${endTime}:00`;

//     const query = `
//       INSERT INTO ticket_info 
//       (car_number, license, driving_person_name, customer_phnNo, 
//        car_owner_name, owner_phnNo, date, start_time, end_time, 
//        spot_name, spotId, user_email)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;
    
//     const [result] = await db.query(query, [
//       carNumber,
//       license || null,
//       driverName || null,
//       customerPhone || null,
//       ownerName || null,
//       ownerPhone || null,
//       date,
//       startDateTime,
//       endDateTime,
//       spotName,
//       spotId || null,
//       userEmail
//     ]);

//     res.json({ 
//       success: true,
//       slotId: result.insertId,
//       message: "Ticket booked successfully"
//     });

//   } catch (err) {
//     console.error('Booking error:', err);
//     res.status(500).json({ 
//       error: 'Booking failed',
//       details: err.message 
//     });
//   }
// });

app.get('/api/verify-token', authenticate, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      name: req.user.name,
      emailID: req.user.emailID,
      // ... other user fields you want to expose
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Password Reset Request
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { emailID } = req.body;
    
    const [users] = await db.query(
      'SELECT * FROM login WHERE emailID = ?', 
      [emailID]
    );
    
    if (!users.length) {
      // Don't reveal if user exists
      return res.json({ 
        success: true,
        message: 'If this email exists, a reset link was sent'
      });
    }

    // Generate and store reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await db.query(
      `INSERT INTO user_tokens 
       (emailID, token_type, token, expires_at)
       VALUES (?, 'reset', ?, ?)`,
      [emailID, token, expiresAt]
    );

    // In production, send email here
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log('Password reset link:', resetLink);

    return res.json({
      success: true,
      message: 'Password reset initiated',
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset failed'
    });
  }
});

// Password Reset Completion
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Validate reset token
    const [tokens] = await db.query(
      `SELECT * FROM user_tokens 
       WHERE token = ? 
       AND token_type = 'reset' 
       AND expires_at > NOW()`,
      [token]
    );
    
    if (!tokens.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const emailID = tokens[0].emailID;
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update password
      await connection.query(
        'UPDATE login SET password = ? WHERE emailID = ?',
        [hashedPassword, emailID]
      );

      // Remove used token
      await connection.query(
        'DELETE FROM user_tokens WHERE token = ?',
        [token]
      );

      await connection.commit();
      
      return res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password update failed'
    });
  }
});

// User Logout
app.post('/api/logout', authenticate, async (req, res) => {
  try {
    const token = req.cookies.token;
    
    // Remove token from database
    await db.query(
      'DELETE FROM user_tokens WHERE token = ?',
      [token]
    );

    // Clear cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Protected User Profile
app.get('/api/user', authenticate, (req, res) => {
  return res.json({
    success: true,
    user: {
      name: req.user.name,
      emailID: req.user.emailID,
      age: req.user.age,
      mobNo: req.user.mobNo,
      gender: req.user.gender
    }
  });
});


// // In your backend (e.g., server.js or routes file)
// app.get('/api/user-tickets', async (req, res) => {
//   try {
//     const { email } = req.query;
//     if (!email) {
//       return res.status(400).json({ error: 'Email is required' });
//     }

//     const query = 'SELECT * FROM ticket_info WHERE user_email = ? ORDER BY date DESC, start_time DESC';
//     const [tickets] = await connection.execute(query, [email]);
    
//     res.json(tickets);
//   } catch (err) {
//     console.error('Error fetching tickets:', err);
//     res.status(500).json({ error: 'Failed to fetch tickets' });
//   }
// });

// Also update your booking endpoint to include the user email:
app.post('/api/book-ticket', async (req, res) => {
  try {
    const { 
      // ... other fields
      userEmail 
    } = req.body;

    const query = `
      INSERT INTO ticket_info 
      (car_number, license, driving_person_name, customer_phnNo, 
       car_owner_name, owner_phnNo, date, start_time, end_time, 
       spot_name, spotId, user_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await connection.execute(query, [
      // ... other values
      userEmail
    ]);
    
    res.json({ success: true, slotId: result.insertId });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get all spots (for delete page)
app.get('/api/admin/spots', authenticateAdmin, async (req, res) => {
    console.log('✅ Admin authenticated:', req.admin);
  try {
    const [spots] = await db.query('SELECT place FROM marked_spots');
    res.json(spots);
  } catch (err) {
    console.error('Error fetching spots:', err);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

// Delete a spot
app.delete('/api/admin/delete-spot', authenticate, async (req, res) => {
  const { spotName } = req.body;

  if (!spotName) {
    return res.status(400).json({ error: 'Spot name is required' });
  }

  try {
    const [result] = await db.query('DELETE FROM marked_spots WHERE place = ?', [spotName]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    res.json({ success: true, message: `Spot "${spotName}" deleted successfully` });
  } catch (err) {
    console.error('Error deleting spot:', err);
    res.status(500).json({ error: 'Failed to delete spot' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS configured for: ${corsOptions.origin}`);
});
