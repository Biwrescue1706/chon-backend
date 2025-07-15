require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { verifyToken } = require('./auth');

const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');

const app = express();

const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'https://mueangchon1.onrender.com'], // ✅ แก้เป็นโดเมนจริง
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('✅ Backend OK');
});

app.use('/register', registerRoutes(db));
app.use('/login', loginRoutes(db));
app.use('/users', userRoutes(db));
app.use('/items', itemRoutes(db));

app.get('/private-data', verifyToken, (req, res) => {
  res.json({ message: 'คุณเข้าถึงข้อมูลลับได้', user: req.user });
});

app.use((req, res) => {
  res.status(404).send('ไม่พบเส้นทางนี้');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
