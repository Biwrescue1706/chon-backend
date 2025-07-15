const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'my_super_secret_key';

function generateToken(payload, expiresIn = '10m') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1] || req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ error: 'ไม่ได้ส่ง token' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
    req.user = decoded;
    next();
  });
}

module.exports = { generateToken, verifyToken };
