import jwt from 'jsonwebtoken';
const JWT_SECRET = "VITE_API_KEY";

const verifyToken = (req, res, next) => {
  // Check for token in cookies, headers, or localStorage (handled by frontend)
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: "Unauthorized - No token provided" 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token Verification Error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Session expired. Please login again." 
      });
    }
    
    return res.status(401).json({ 
      error: "Invalid token" 
    });
  }
};

export default verifyToken;