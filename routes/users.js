const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET ALL
  router.get('/', async (req, res) => {
    db.ref('users').once('value')
      .then(snapshot => res.json(snapshot.val() || {}))
      .catch(err => {
        console.error('[FIREBASE ERROR]', err);
        res.status(500).send('เกิดข้อผิดพลาด');
      });
  });

  // GET BY ID
  router.get('/:userid', async (req, res) => {
    const targetUserId = req.params.userid;

    try {
      const snapshot = await db.ref('users').once('value');
      const users = snapshot.val() || {};

      let foundUser = null;
      Object.values(users).forEach(user => {
        if (String(user.UserId) === String(targetUserId)) {
          foundUser = user;
        }
      });

      if (!foundUser) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
      }

      res.json(foundUser);
    } catch (err) {
      console.error('[GET USER ERROR]', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
  });

  // UPDATE BY ID
  router.put('/:userid', async (req, res) => {
    const targetUserId = req.params.userid;
    const { name, email, role } = req.body;

    if (!name && !email && !role) {
      return res.status(400).json({ error: 'กรุณาส่งข้อมูลที่ต้องการแก้ไข' });
    }

    try {
      const snapshot = await db.ref('users').once('value');
      const users = snapshot.val() || {};

      let foundKey = null;
      Object.entries(users).forEach(([key, user]) => {
        if (String(user.UserId) === String(targetUserId)) {
          foundKey = key;
        }
      });

      if (!foundKey) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
      }

      const updates = {};
      if (name) updates.Name = name;
      if (email) updates.Email = email;
      if (role) updates.Role = role;

      await db.ref(`users/${foundKey}`).update(updates);

      res.status(200).json({ message: 'อัปเดตสำเร็จ', updates });
    } catch (err) {
      console.error('[UPDATE ERROR]', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
  });

  // DELETE BY ID
  router.delete('/:userid', async (req, res) => {
    const targetUserId = req.params.userid;

    try {
      const snapshot = await db.ref('users').once('value');
      const users = snapshot.val() || {};

      let foundKey = null;
      Object.entries(users).forEach(([key, user]) => {
        if (String(user.UserId) === String(targetUserId)) {
          foundKey = key;
        }
      });

      if (!foundKey) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
      }

      await db.ref(`users/${foundKey}`).remove();
      res.json({ message: 'ลบสำเร็จ' });
    } catch (err) {
      console.error('[DELETE ERROR]', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
  });

  return router;
};
