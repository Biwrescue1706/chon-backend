const API_BASE = 'https://mueangchon1.onrender.com';

function logout() {
  fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include'
  })
  .then(() => {
    Swal.fire({
      icon: 'success',
      title: 'ออกจากระบบสำเร็จ',
      timer: 1000,
      showConfirmButton: false
    }).then(() => {
      window.location.href = 'login.html';
    });
  })
  .catch(() => {
    Swal.fire('ผิดพลาด', 'ไม่สามารถออกจากระบบได้', 'error');
  });
}

// ฟังก์ชันตรวจสอบว่ามี token หรือยัง (ลองดึงข้อมูลลับดู)
async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/private-data`, {
      credentials: 'include'
    });
    if (!res.ok) {
      // ถ้าไม่ได้ login ให้ไปหน้า login
      window.location.href = 'login.html';
    }
  } catch (err) {
    window.location.href = 'login.html';
  }
}

checkAuth();
