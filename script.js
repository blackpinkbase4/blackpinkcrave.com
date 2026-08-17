function toggleTheme() {
  const body = document.body;
  const themeBtnDesktop = document.getElementById('themeToggleBtn');
  const themeBtnMobile = document.getElementById('themeToggleBtnMobile');
  
  if (body.getAttribute('data-theme') === 'dark') {
    body.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '🌙';
    if (themeBtnMobile) themeBtnMobile.textContent = '🌙';
  } else {
    body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '☀️';
    if (themeBtnMobile) themeBtnMobile.textContent = '☀️';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const body = document.body;
  const themeBtnDesktop = document.getElementById('themeToggleBtn');
  const themeBtnMobile = document.getElementById('themeToggleBtnMobile');

  if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '☀️';
    if (themeBtnMobile) themeBtnMobile.textContent = '☀️';
  } else {
    body.setAttribute('data-theme', 'light');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '🌙';
    if (themeBtnMobile) themeBtnMobile.textContent = '🌙';
  }

  body.setAttribute('data-era', 'classic');
});