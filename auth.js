const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'my_super_secret_key';

console.log('🔐 Loaded SECRET_KEY:', SECRET_KEY);

function generateToken(payload, expiresIn = '10m') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token ไม่ถูกต้อง' });
    req.user = decoded;
    next();
  });
}

module.exports = { generateToken, verifyToken };
