const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const app = express();
app.use(cors());
app.use(express.json());

// const serviceAccount = require('./serviceAccountKey.json'); // ไฟล์ JSON ที่โหลดจาก Firebase Console

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

// GET Users
app.get('/Users', (req, res) => {
  const ref = db.ref('users');
  ref.once('value')
    .then(snapshot => {
      res.json(snapshot.val() || {});
    })
    .catch(err => {
      console.error('[FIREBASE ERROR]', err);
      res.status(500).send('เกิดข้อผิดพลาด');
    });
});

// POST Register
app.post('/register', async (req, res) => {
  const { username, password, name, email, role } = req.body;

  if (!username || !password || !name || !email || !role) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  }

  try {
    const ref = db.ref('users');

    // ดึง Users ทั้งหมด
    const snapshot = await ref.once('value');
    const users = snapshot.val() || {};

    // ตรวจสอบ username ซ้ำ
    const isDuplicate = Object.values(users).some(u => u.Username === username);
    if (isDuplicate) {
      return res.status(409).json({ error: 'Username นี้ถูกใช้แล้ว' });
    }

    // หา max UserId
    let maxId = 0;
    Object.values(users).forEach(u => {
      const idNum = parseInt(u.UserId);
      if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
    });
    const newUserId = maxId + 1;

    // สร้างข้อมูลใหม่
    const now = new Date().toISOString();
    const newUserRef = ref.push();
    await newUserRef.set({
      UserId: newUserId.toString(),
      Username: username,
      Password: password,
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
