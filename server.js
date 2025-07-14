const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// ดึง Service Account จาก ENV
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// ✅ สำคัญ: แก้ newline ให้ private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// ✅ ใช้ URL ที่ถูกต้อง
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mueangchonburi-c9438-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// ชี้ไปที่ Realtime Database
const db = admin.database();

// Test route
app.get('/', (req, res) => {
  res.send('✅ Backend OK - Firebase Realtime Database');
});

// GET items
app.get('/items', (req, res) => {
  const ref = db.ref('items');
  ref.once('value')
    .then(snapshot => {
      res.json(snapshot.val() || {});
    })
    .catch(err => {
      console.error('[FIREBASE ERROR]', err);
      res.status(500).send('เกิดข้อผิดพลาด');
    });
});

// POST item
app.post('/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('กรุณาส่ง name ด้วย');

  const ref = db.ref('items').push();
  ref
    .set({ name })
    .then(() => res.status(201).json({ id: ref.key, name }))
    .catch(err => {
      console.error('Write failed:', err);
      res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
