const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json'); // ไฟล์ JSON ที่โหลดจาก Firebase Console

const app = express();
app.use(cors());
app.use(express.json());

// เริ่ม Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mueangchonburi-c9438-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

app.get('/', (req, res) => {
  res.send('✅ Backend OK - Firebase Realtime Database');

});

app.get('/items', (req, res) => {
  const ref = db.ref('items');
  ref.once(
    'value',
    snapshot => {
      res.json(snapshot.val() || {}); // คืนค่าเป็น object ว่างถ้าไม่มีข้อมูล
    },
    errorObject => {
      console.error('Read failed:', errorObject);
      res.status(500).send('เกิดข้อผิดพลาดในการอ่านข้อมูล');
    }
  );
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
