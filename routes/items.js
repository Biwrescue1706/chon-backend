const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    db.ref('items').once('value')
      .then(snapshot => res.json(snapshot.val() || {}))
      .catch(err => {
        console.error('[FIREBASE ERROR]', err);
        res.status(500).send('เกิดข้อผิดพลาด');
      });
  });

  router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).send('กรุณาส่ง name');

    const ref = db.ref('items').push();
    ref.set({ name })
      .then(() => res.status(201).json({ id: ref.key, name }))
      .catch(err => {
        console.error('[WRITE ERROR]', err);
        res.status(500).send('เกิดข้อผิดพลาด');
      });
  });

  return router;
};
