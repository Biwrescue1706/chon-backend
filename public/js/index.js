(function() {
  const API_BASE = 'https://mueangchon1.onrender.com/api';

  const namesUl = document.getElementById('names-ul');
  const booksUl = document.getElementById('books-ul');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const searchInput = document.getElementById('search-input');
  const userNameDiv = document.getElementById('user-name');

  // ฟังก์ชัน decode JWT payload
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // ดึง JWT จาก cookie
  function getJwtFromCookie() {
    const match = document.cookie.match(/(^| )jwt=([^;]+)/);
    return match ? match[2] : null;
  }

  // แสดงชื่อผู้ใช้จาก token
  function showUserNameFromToken() {
    const token = getJwtFromCookie();
    if (!token) {
      userNameDiv.textContent = 'กรุณาเข้าสู่ระบบ';
      return;
    }
    const payload = parseJwt(token);
    if (payload && payload.Username) {
      userNameDiv.textContent = `ยินดีต้อนรับ คุณ ${payload.Username}`;
    } else {
      userNameDiv.textContent = 'ไม่พบข้อมูลผู้ใช้';
    }
  }

  // แปลง object เป็น array (firebase data)
  function objectToArray(obj) {
    return Object.values(obj || {});
  }

  window.addEventListener('DOMContentLoaded', () => {
    showUserNameFromToken(); // แสดงชื่อผู้ใช้
    fetchUsers();
    fetchBooks();

    searchInput.addEventListener('input', handleSearch);
  });

  async function fetchUsers() {
    loadingDiv.style.display = 'block';
    try {
      const res = await fetch(`${API_BASE}/users`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        renderUsers(objectToArray(data));
      } else {
        showError(data.error || 'เกิดข้อผิดพลาดในการโหลดผู้ใช้');
      }
    } catch (err) {
      showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      loadingDiv.style.display = 'none';
    }
  }

  async function fetchBooks() {
    loadingDiv.style.display = 'block';
    try {
      const res = await fetch(`${API_BASE}/books`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        renderBooks(objectToArray(data));
      } else {
        showError(data.error || 'เกิดข้อผิดพลาดในการโหลดหนังสือ');
      }
    } catch (err) {
      showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      loadingDiv.style.display = 'none';
    }
  }

  function renderUsers(users) {
    namesUl.innerHTML = '';
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = `${user.Name} (${user.Username})`;
      namesUl.appendChild(li);
    });
  }

  let allBooks = [];

  function renderBooks(books) {
    allBooks = books;
    showFilteredBooks(books);
  }

  function showFilteredBooks(books) {
    booksUl.innerHTML = '';
    books.forEach(book => {
      const li = document.createElement('li');
      li.textContent = `📖 ${book.Title} (${book.BooksId || book.BookNo || ''})`;
      booksUl.appendChild(li);
    });
  }

  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = allBooks.filter(book =>
      book.Title.toLowerCase().includes(query) ||
      (book.BooksId && book.BooksId.toString().toLowerCase().includes(query)) ||
      (book.BookNo && book.BookNo.toLowerCase().includes(query))
    );
    showFilteredBooks(filtered);
  }

  function showError(message) {
    errorDiv.textContent = message;
    Swal.fire({
      icon: 'error',
      title: 'ผิดพลาด',
      text: message
    });
  }
})();
