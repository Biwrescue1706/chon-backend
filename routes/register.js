const express = require('express');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

module.exports = (db) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const { username, password, name, email, role } = req.body;

    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
      const ref = db.ref('users');
      const snapshot = await ref.once('value');
      const users = snapshot.val() || {};

      const isDuplicate = Object.values(users).some(u => u.Username === username);
      if (isDuplicate) {
        return res.status(409).json({ error: 'Username นี้ถูกใช้แล้ว' });
      }

      let maxId = 0;
      Object.values(users).forEach(u => {
        const idNum = parseInt(u.UserId);
        if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
      });
      const newUserId = maxId + 1;

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const now = new Date().toISOString();

      const newUserRef = ref.push();
      await newUserRef.set({
        UserId: newUserId,
        Username: username,
        Password: hashedPassword,
        Name: name,
        Email: email,
        Role: role,
        created_at: now
      });

      res.status(201).json({ id: newUserRef.key, UserId: newUserId });
    } catch (err) {
      console.error('[REGISTER ERROR]', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในฝั่งเซิร์ฟเวอร์' });
    }
  });

  return router;
};
