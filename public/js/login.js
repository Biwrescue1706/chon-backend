const API_BASE = 'https://mueangchon1.onrender.com/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'index.html';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อผิดพลาด',
      text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
    });
  }
});
