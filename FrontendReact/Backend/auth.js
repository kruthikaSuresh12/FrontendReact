// import express from 'express';
// import db from './db.js';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';

// const router = express.Router();
// const JWT_SECRET = "JWT_SECRET";

// // USER SIGNUP (Always hash new passwords)
// router.post('/signup', async (req, res) => {
//   const { name, age, emailID, mobNo, password, confirm_password, gender } = req.body;

//   if (!emailID || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     // Check if user exists
//     const [existingUsers] = await db.promise().query(
//       "SELECT * FROM login WHERE emailID = ?", 
//       [emailID]
//     );
    
//     if (existingUsers.length > 0) {
//       return res.status(409).json({ error: "User already exists" });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(password, 10);
    
//     // Insert new user with hashed password
//     await db.promise().query(
//       `INSERT INTO login 
//        (name, age, emailID, mobNo, password, confirm_password, gender) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`, 
//       [name, age, emailID, mobNo, hashedPassword, confirm_password, gender]
//     );
    
//     res.status(201).json({ message: "User created successfully" });
//   } catch (error) {
//     console.error("Signup Error:", error);
//     res.status(500).json({ error: "User creation failed" });
//   }
// });

// // USER LOGIN (Assume all passwords are hashed)
// router.post('/login', async (req, res) => {
//   const { emailID, password } = req.body;
  
//   if (!emailID || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     // Find user
//     const [users] = await db.promise().query(
//       "SELECT * FROM login WHERE emailID = ?", 
//       [emailID]
//     );
    
//     if (users.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const user = users[0];
    
//     // Compare with bcrypt (will fail for old plaintext passwords)
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { emailID: user.emailID, name: user.name },
//       JWT_SECRET,
//       { expiresIn: '2h' }
//     );

//     res.json({ 
//       token,
//       user: {
//         name: user.name,
//         emailID: user.emailID
//       }
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

// export default router; 