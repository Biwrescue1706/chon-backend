// auth.js
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'my_super_secret_key'; // แนะนำใช้ ENV

// สร้าง token
function generateToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

// ตรวจสอบ token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'ไม่ได้ส่ง token' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    req.user = decoded; // attach payload ไปใน req.user
    next();
  });
}

module.exports = { generateToken, verifyToken };
