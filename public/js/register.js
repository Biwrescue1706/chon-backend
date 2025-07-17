var API_BASE = 'https://mueangchon1.onrender.com/api';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const username = form.username.value.trim();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const role = form.role.value;

  if (!role) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณาเลือกสายงาน',
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, email, role })
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'login.html';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'สมัครสมาชิกไม่สำเร็จ',
        text: data.error || 'เกิดข้อผิดพลาด'
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
