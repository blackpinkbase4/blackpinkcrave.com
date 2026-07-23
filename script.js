function toggleTheme() {
  const body = document.body;
  const themeBtnDesktop = document.getElementById('themeToggleBtn');
  const themeBtnMobile = document.getElementById('themeToggleBtnMobile');
  
  if (body.getAttribute('data-theme') === 'light') {
    body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '☀️';
    if (themeBtnMobile) themeBtnMobile.textContent = '☀️';
  } else {
    body.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '🌙';
    if (themeBtnMobile) themeBtnMobile.textContent = '🌙';
  }
}

function closeMobileMenu() {
  const menuOverlay = document.getElementById('mobileMenuOverlay');
  const menuBackdrop = document.getElementById('mobileMenuBackdrop');
  if (menuOverlay) menuOverlay.classList.remove('active');
  if (menuBackdrop) menuBackdrop.classList.remove('active');
  document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.protocol === 'file:') {
    const warningBanner = document.createElement('div');
    warningBanner.style.backgroundColor = '#ef4444';
    warningBanner.style.color = '#ffffff';
    warningBanner.style.textAlign = 'center';
    warningBanner.style.padding = '12px';
    warningBanner.style.fontSize = '12px';
    warningBanner.style.fontFamily = 'var(--font-sans)';
    warningBanner.style.fontWeight = '600';
    warningBanner.style.letterSpacing = '0.5px';
    warningBanner.style.position = 'sticky';
    warningBanner.style.top = '0';
    warningBanner.style.zIndex = '99999';
    warningBanner.innerHTML = '⚠️ PROTOCOL SECURITY LIMITATION: You opened this page directly as a local file (file://). Changes made in the admin panel will NOT sync to the site. Please use <a href="http://localhost:3000" style="color: #ffffff; text-decoration: underline; font-weight: 700;">http://localhost:3000</a> instead.';
    document.body.insertBefore(warningBanner, document.body.firstChild);
  }

  const savedTheme = localStorage.getItem('theme');
  const body = document.body;
  const themeBtnDesktop = document.getElementById('themeToggleBtn');
  const themeBtnMobile = document.getElementById('themeToggleBtnMobile');

  if (savedTheme === 'light') {
    body.setAttribute('data-theme', 'light');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '🌙';
    if (themeBtnMobile) themeBtnMobile.textContent = '🌙';
  } else {
    body.removeAttribute('data-theme');
    if (themeBtnDesktop) themeBtnDesktop.textContent = '☀️';
    if (themeBtnMobile) themeBtnMobile.textContent = '☀️';
  }

  const menuToggle = document.getElementById('menuToggleBtn');
  const menuClose = document.getElementById('mobileMenuCloseBtn');
  const menuOverlay = document.getElementById('mobileMenuOverlay');
  const menuBackdrop = document.getElementById('mobileMenuBackdrop');

  if (menuToggle && menuOverlay && menuBackdrop) {
    menuToggle.addEventListener('click', () => {
      menuOverlay.classList.add('active');
      menuBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', closeMobileMenu);
  }

  renderCraveTicker();
  renderCraveMembers();

  loadCraveCDNConfig();
});

function renderCraveTicker() {
  const savedTicker = localStorage.getItem('crave_ticker_overrides');
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    let customTicker = [];
    if (savedTicker) {
      customTicker = JSON.parse(savedTicker);
    } else {
      const items = tickerTrack.querySelectorAll('.ticker-item');
      const uniqueCount = Math.floor(items.length / 2);
      if (uniqueCount > 0) {
        for (let i = 0; i < uniqueCount; i++) {
          customTicker.push(items[i].textContent.replace('✦', '').trim());
        }
      }
    }

    if (customTicker.length > 0) {
      let baseHTML = '';
      customTicker.forEach(msg => {
        if (msg) {
          baseHTML += `<div class="ticker-item"><span>✦</span> ${msg}</div>`;
        }
      });

      if (baseHTML) {
        const repetitions = Math.ceil(16 / customTicker.length) * 2;
        let trackHTML = '';
        for (let i = 0; i < repetitions; i++) {
          trackHTML += baseHTML;
        }
        tickerTrack.innerHTML = trackHTML;

        const totalItems = customTicker.length * repetitions;
        const duration = (totalItems / 2) * 8;
        tickerTrack.style.animationDuration = `${duration}s`;
      }
    }
  }
}

function renderCraveMembers() {
  const savedMembers = localStorage.getItem('crave_member_overrides');
  if (savedMembers) {
    const customMembers = JSON.parse(savedMembers);
    
    const isSolosPage = window.location.pathname.includes('solos.html');
    const isHomepage = !isSolosPage && !document.querySelector('.nav-breadcrumb');
    const memberColumns = document.querySelectorAll('.member-column');
    if (memberColumns.length > 0 && isHomepage) {
      memberColumns.forEach(col => {
        const overlay = col.querySelector('.member-overlay');
        if (overlay) {
          const nameEl = overlay.querySelector('.member-name');
          const roleEl = overlay.querySelector('.member-role');
          if (nameEl) {
            const nameText = nameEl.textContent.trim().toLowerCase();
            let memberKey = "";
            if (nameText.includes("jisoo")) memberKey = "jisoo";
            else if (nameText.includes("jennie")) memberKey = "jennie";
            else if (nameText.includes("ros")) memberKey = "rose";
            else if (nameText.includes("lisa")) memberKey = "lisa";

            if (memberKey && customMembers[memberKey]) {
              const m = customMembers[memberKey];
              if (m.name) nameEl.textContent = m.name;
            }
          }
        }
      });
    }

    const breadcrumb = document.querySelector('.nav-breadcrumb');
    if (breadcrumb) {
      const pathText = breadcrumb.textContent.trim().toLowerCase();
      let activeMember = null;
      
      if (pathText.includes('jisoo')) activeMember = 'jisoo';
      else if (pathText.includes('jennie')) activeMember = 'jennie';
      else if (pathText.includes('rose') || pathText.includes('rosé')) activeMember = 'rose';
      else if (pathText.includes('lisa')) activeMember = 'lisa';

      if (activeMember && customMembers[activeMember]) {
        const m = customMembers[activeMember];
        
        const heroTitle = document.querySelector('.profile-hero-title');
        if (heroTitle && m.name) {
          heroTitle.textContent = m.name.toUpperCase();
        }

        const heroTag = document.querySelector('.profile-hero-tag');
        if (heroTag && m.label) {
          heroTag.textContent = m.label;
        }

        const bioPara = document.querySelector('.profile-bio-p');
        if (bioPara && m.bio) {
          bioPara.textContent = m.bio;
        }

        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle && (pathText.includes('jisoo') || pathText.includes('jennie') || pathText.includes('rose') || pathText.includes('lisa'))) {
          if (m.name) {
            sectionTitle.textContent = m.name;
          }
        }

        const infoCards = document.querySelectorAll('.profile-info-card');
        infoCards.forEach(card => {
          const label = card.querySelector('.card-label');
          const value = card.querySelector('.card-value');
          if (label && value) {
            const labelText = label.textContent.trim().toLowerCase();
            if (labelText.includes('agency') || labelText.includes('label')) {
              if (m.label) value.textContent = m.label;
            } else if (labelText.includes('brand') || labelText.includes('alignments')) {
              if (m.brands) value.textContent = m.brands;
            } else if (labelText.includes('project')) {
              if (m.project) value.textContent = m.project;
            }
          }
        });
      }
    }
  }
}

async function loadCraveCDNConfig() {
  try {
    if (window.location.pathname.includes('admin.html')) {
      return;
    }

    const res = await fetch(`config.json?t=${Date.now()}`);
    if (res.ok) {
      const config = await res.json();
      if (config.ticker) localStorage.setItem('crave_ticker_overrides', JSON.stringify(config.ticker));
      if (config.members) localStorage.setItem('crave_member_overrides', JSON.stringify(config.members));
      if (config.votings) localStorage.setItem('crave_voting_data', JSON.stringify(config.votings));
      if (config.stats) localStorage.setItem('crave_stats_data', JSON.stringify(config.stats));
      if (config.schedules) localStorage.setItem('crave_schedules', JSON.stringify(config.schedules));
      if (config.soloStats) localStorage.setItem('crave_solo_stats_data', JSON.stringify(config.soloStats));
      if (config.playlists) localStorage.setItem('crave_playlists_data', JSON.stringify(config.playlists));
      if (config.promos) localStorage.setItem('crave_promos_data', JSON.stringify(config.promos));
      if (config.mvs) localStorage.setItem('crave_mv_data', JSON.stringify(config.mvs));
      if (config.supportLink) localStorage.setItem('crave_support_link', config.supportLink);

      renderCraveTicker();
      renderCraveMembers();

      if (typeof loadStats === 'function') loadStats();
      if (typeof loadPlaylists === 'function') loadPlaylists();
      if (typeof loadVotings === 'function') loadVotings();
      if (typeof loadSchedules === 'function') loadSchedules();
      if (typeof loadPromoModal === 'function') loadPromoModal();
      if (typeof loadMvs === 'function') loadMvs();
    }
  } catch (e) {}
}

function closeAnniversaryBar() {
  const bar = document.getElementById('anniversaryBar');
  if (bar) {
    bar.classList.add('closed');
  }
}

function initAnniversaryCountdown() {
  const targetDate = new Date("2026-08-08T00:00:00+09:00").getTime();

  function updateClock() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    const daysEl = document.getElementById('annDays');
    const hoursEl = document.getElementById('annHours');
    const minsEl = document.getElementById('annMins');
    const secsEl = document.getElementById('annSecs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent = String(minutes).padStart(2, '0');
    secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateClock();
  setInterval(updateClock, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  initAnniversaryCountdown();
});
