require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { generateToken, verifyToken } = require('./auth');

const app = express();
const SALT_ROUNDS = 10;

// === CORS ===
const corsOptions = {
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://mueangchon1.onrender.com',
    'https://biwrescue1706.github.io'
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// === Firebase Admin ===
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mueangchonburi-c9438-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
const booksRef = db.ref('books');
const usersRef = db.ref('users');

// === Health ===
app.get('/', (req, res) => {
  res.send('✅ Backend OK');
});

// === Auth: Register ===
app.post('/register', async (req, res) => {
  const { username, password, name, email, role } = req.body;
  if (!username || !password || !name || !email || !role) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  }

  try {
    const snapshot = await usersRef.once('value');
    const users = snapshot.val() || {};
    const isDuplicate = Object.values(users).some(u => u.Username === username);
    if (isDuplicate) {
      return res.status(409).json({ error: 'Username ซ้ำ' });
    }

    let maxId = 0;
    Object.values(users).forEach(u => {
      const idNum = parseInt(u.UserId);
      if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
    });
    const newUserId = maxId + 1;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const newUserRef = usersRef.push();
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
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// === Auth: Login ===
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  try {
    const snapshot = await usersRef.once('value');
    const users = snapshot.val() || {};
    const user = Object.values(users).find(u => u.Username === username);
    if (!user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

    const match = await bcrypt.compare(password, user.Password);
    if (!match) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

    const token = generateToken({
      UserId: user.UserId,
      Username: user.Username,
      Role: user.Role
    }, '10m');

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 10 * 60 * 1000
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

// === Auth: Logout ===
app.post('/logout', (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 0
  });
  res.json({ message: 'ออกจากระบบแล้ว' });
});

// === Users ===
app.get('/users', async (_req, res) => {
  const snapshot = await usersRef.once('value');
  res.json(snapshot.val() || {});
});

app.get('/users/:id', async (req, res) => {
  const id = req.params.id;
  const snapshot = await usersRef.once('value');
  const users = snapshot.val() || {};
  const found = Object.values(users).find(u => String(u.UserId) === id);
  if (!found) return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
  res.json(found);
});

app.put('/users/:id', async (req, res) => {
  const id = req.params.id;
  const { name, email, role } = req.body;
  const snapshot = await usersRef.once('value');
  const users = snapshot.val() || {};
  let foundKey = null;
  Object.entries(users).forEach(([key, u]) => {
    if (String(u.UserId) === id) foundKey = key;
  });
  if (!foundKey) return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });

  const updates = {};
  if (name) updates.Name = name;
  if (email) updates.Email = email;
  if (role) updates.Role = role;

  await usersRef.child(foundKey).update(updates);
  res.json({ message: 'อัปเดตสำเร็จ', updates });
});

app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const snapshot = await usersRef.once('value');
  const users = snapshot.val() || {};
  let foundKey = null;
  Object.entries(users).forEach(([key, u]) => {
    if (String(u.UserId) === id) foundKey = key;
  });
  if (!foundKey) return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });

  await usersRef.child(foundKey).remove();
  res.json({ message: 'ลบสำเร็จ' });
});

// === Books ===
app.post('/books', async (req, res) => {
  const { BooksId, BookNo, date, from, to = 'ผกก', Title, Work, note } = req.body;
  if (!Title) return res.status(400).json({ error: 'ต้องระบุ Title' });

  const ref = booksRef.push();
  await ref.set({ BooksId, BookNo, date, from, to, Title, Work, note });
  res.status(201).json({ id: ref.key, BooksId });
});

app.get('/books', async (_req, res) => {
  const snapshot = await booksRef.once('value');
  res.json(snapshot.val() || {});
});

app.get('/books/:id', async (req, res) => {
  const id = req.params.id;
  const snapshot = await booksRef.child(id).once('value');
  if (!snapshot.exists()) return res.status(404).json({ error: 'ไม่พบหนังสือ' });
  res.json(snapshot.val());
});

app.put('/books/:id', async (req, res) => {
  const id = req.params.id;
  const snapshot = await booksRef.child(id).once('value');
  if (!snapshot.exists()) return res.status(404).json({ error: 'ไม่พบหนังสือ' });

  await booksRef.child(id).update(req.body);
  res.json({ message: 'อัปเดตสำเร็จ', updates: req.body });
});

app.delete('/books/:id', async (req, res) => {
  const id = req.params.id;
  const snapshot = await booksRef.child(id).once('value');
  if (!snapshot.exists()) return res.status(404).json({ error: 'ไม่พบหนังสือ' });

  await booksRef.child(id).remove();
  res.json({ message: 'ลบหนังสือสำเร็จ' });
});

// === Private Protect ===
app.get('/private-data', verifyToken, (req, res) => {
  res.json({ message: '✅ ข้อมูลลับ', user: req.user });
});

// === Fallback ===
app.use((req, res) => {
  res.status(404).send('ไม่พบเส้นทางนี้');
});

// === Start ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
