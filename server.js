const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 👇 สำคัญมาก!
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mueangchonburi-c9438.firebaseio.com"
});

const db = admin.database();

app.get('/', (req, res) => {
  res.send('✅ Backend OK - Firebase Realtime Database');

});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
