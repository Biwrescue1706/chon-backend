const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const app = express();
app.use(cors());
app.use(express.json());

// ======= Firebase Setup =======
// const serviceAccount = require('./serviceAccountKey.json');

// หรือถ้าใช้ ENV
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mueangchonburi-c9438-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ======= Routes =======

// Health Check
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

// ======= Register =======
app.post('/register', async (req, res) => {
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
      UserId: newUserId.toString(),
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

// ======= Login =======
app.post('/login', async (req, res) => {
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

    res.status(200).json({
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
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในฝั่งเซิร์ฟเวอร์' });
  }
});

// ======= Update User =======
app.put('/users/:id', async (req, res) => {
  const userId = req.params.id; // Firebase push key
  const { name, email, role } = req.body;

  if (!name && !email && !role) {
    return res.status(400).json({ error: 'กรุณาส่งข้อมูลที่ต้องการแก้ไข' });
  }

  try {
    const ref = db.ref(`users/${userId}`);

    const snapshot = await ref.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
    }

    const updates = {};
    if (name) updates.Name = name;
    if (email) updates.Email = email;
    if (role) updates.Role = role;

    await ref.update(updates);

    res.status(200).json({ message: 'อัปเดตสำเร็จ', updates });
  } catch (err) {
    console.error('[UPDATE ERROR]', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในฝั่งเซิร์ฟเวอร์' });
  }
});

// ======= Delete User =======
app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id; // Firebase push key

  try {
    const ref = db.ref(`users/${userId}`);

    const snapshot = await ref.once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
    }

    await ref.remove();

    res.status(200).json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error('[DELETE ERROR]', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในฝั่งเซิร์ฟเวอร์' });
  }
});

// ======= Fallback =======
app.use((req, res) => {
  res.status(404).send('ไม่พบเส้นทางนี้');
});

// ======= Start =======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
