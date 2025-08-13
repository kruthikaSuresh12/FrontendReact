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
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'kruthi@1234',
  database: process.env.DB_NAME || 'parking',
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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api', ticketSlotRoutes);
app.use('/api', bookTicketRoutes);

// Token cleanup scheduler
setInterval(async () => {
  try {
    await db.query('DELETE FROM user_tokens WHERE expires_at < NOW()');
    console.log('Cleaned up expired tokens');
  } catch (err) {
    console.error('Token cleanup error:', err);
  }
}, 3600000); // Runs hourly

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
        secure: false,
        maxAge: 3600000,
        sameSite: 'lax',
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
      sameSite: 'lax',
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

app.post('/api/book-ticket', authenticate, async (req, res) => {
  try {
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
      spotName,
      spotId
    } = req.body;

    const userEmail = req.user.emailID;

    const startDateTime = `${date} ${startTime}:00`;
    const endDateTime = `${date} ${endTime}:00`;

    const query = `
      INSERT INTO ticket_info 
      (car_number, license, driving_person_name, customer_phnNo, 
       car_owner_name, owner_phnNo, date, start_time, end_time, 
       spot_name, spotId, user_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(query, [
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
      spotId || null,
      userEmail
    ]);

    res.json({ 
      success: true,
      slotId: result.insertId,
      message: "Ticket booked successfully"
    });

  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ 
      error: 'Booking failed',
      details: err.message 
    });
  }
});

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
      sameSite: 'lax',
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


// In your backend (e.g., server.js or routes file)
app.get('/api/user-tickets', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const query = 'SELECT * FROM ticket_info WHERE user_email = ? ORDER BY date DESC, start_time DESC';
    const [tickets] = await connection.execute(query, [email]);
    
    res.json(tickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

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