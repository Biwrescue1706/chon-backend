const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken } = require('../auth');

module.exports = (db) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    try {
      const ref = db.ref('users');
      const snapshot = await ref.once('value');
      const users = snapshot.val() || {};

      const user = Object.values(users).find(u => u.Username === username);
      if (!user) {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      const match = await bcrypt.compare(password, user.Password);
      if (!match) {
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      // ✅ สร้าง token อายุ 10 นาที
      const token = generateToken({
        UserId: user.UserId,
        Username: user.Username,
        Role: user.Role,
        Name: user.Name
      }, '10m'); // ระบุ expiresIn เป็น 10 นาที

      // ✅ ตั้ง cookie อายุ 10 นาที
      res.cookie('jwt', token, {
        httpOnly: true,   // ✅ ปลอดภัย
        secure: true,     // ✅ Render ใช้ HTTPS
        sameSite: 'None', // ✅ Cross-origin
        maxAge: 10 * 60 * 1000 // 10 นาที
      });
      res.json({
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          UserId: user.UserId,
          Username: user.Username,
          Name: user.Name,
          Email: user.Email,
          Role: user.Role
        }
      });

    } catch (err) {
      console.error('[LOGIN ERROR]', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
  });

  return router;
};
