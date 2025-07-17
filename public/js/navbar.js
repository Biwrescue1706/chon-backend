fetch('nav.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar').innerHTML = data;
  })
  .catch(err => console.error('โหลด nav ไม่สำเร็จ:', err));
