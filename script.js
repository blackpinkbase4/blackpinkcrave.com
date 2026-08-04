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
      if (config.newRelease) localStorage.setItem('crave_new_release_data', JSON.stringify(config.newRelease));
      if (config.supportLink) localStorage.setItem('crave_support_link', config.supportLink);
      if (config.anniversary) {
        const wasEnabled = localStorage.getItem('crave_anniversary_enabled') === 'true';
        const isNowEnabled = config.anniversary.enabled === true || config.anniversary.enabled === 'true';
        localStorage.setItem('crave_anniversary_enabled', isNowEnabled ? 'true' : 'false');
        localStorage.setItem('crave_tribute_video_url', config.anniversary.videoUrl || 'videos/anniversary.mp4');
        localStorage.setItem('crave_anniversary_bg_song', config.anniversary.bgSongUrl || 'https://ccrma.stanford.edu/~jos/mp3/pno-cs.mp3');
        
        
        const targetDate = new Date("2026-08-08T00:00:00+09:00").getTime();
        const isFinished = (targetDate - new Date().getTime()) <= 0;
        if ((isFinished || isNowEnabled) && !window.location.pathname.includes('admin.html') && !window.location.pathname.includes('anniversary.html')) {
          if (!sessionStorage.getItem('anniversary_dismissed')) {
            window.location.href = 'anniversary.html';
          }
        }
      }

      renderCraveTicker();
      renderCraveMembers();

      if (typeof loadStats === 'function') loadStats();
      if (typeof loadPlaylists === 'function') loadPlaylists();
      if (typeof loadVotings === 'function') loadVotings();
      if (typeof loadSchedules === 'function') loadSchedules();
      if (typeof loadPromoModal === 'function') loadPromoModal();
      if (typeof loadMvs === 'function') loadMvs();
      if (typeof loadNewRelease === 'function') loadNewRelease();
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
  if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('anniversary.html')) {
    return;
  }
  const targetDate = new Date("2026-08-08T00:00:00+09:00").getTime();

  function updateClock() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    const daysEl = document.getElementById('annDays');
    const hoursEl = document.getElementById('annHours');
    const minsEl = document.getElementById('annMins');
    const secsEl = document.getElementById('annSecs');

    const enabledOverride = localStorage.getItem('crave_anniversary_enabled') === 'true';
    const isFinished = diff <= 0;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
    } else {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
    }

    if (isFinished || enabledOverride) {
      const dismissed = sessionStorage.getItem('anniversary_dismissed');
      if (!dismissed) {
        window.location.href = 'anniversary.html';
      }
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('crave_premium_logged_in') === 'true') {
    const currentPage = window.location.pathname.split('/').pop();
    const isAtHome = (currentPage === '' || currentPage === 'index.html' || window.location.pathname === '/' || currentPage === 'premium_login.html');
    const isStreamingGoalsLink = window.location.hash.includes('active-streaming-goals');
    
    if (isAtHome && !isStreamingGoalsLink) {
      window.location.href = 'premium.html';
      return;
    }
    
    document.querySelectorAll('a[href="index.html"], a[href="index.html?v=2"]').forEach(link => {
      link.href = 'premium.html';
    });
    
    const breadcrumb = document.querySelector('.nav-breadcrumb');
    if (breadcrumb && !breadcrumb.textContent.includes('PREMIUM')) {
      breadcrumb.innerHTML = `/ PREMIUM HUB ${breadcrumb.innerHTML}`;
    }
  }

  initAnniversaryCountdown();

  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !document.getElementById('premiumHubBtn')) {
    const li = document.createElement('li');
    const isLoggedIn = localStorage.getItem('crave_premium_logged_in') === 'true';
    li.innerHTML = isLoggedIn ? 
      `<a href="premium.html" id="premiumHubBtn" style="border: 1px solid #f06292; padding: 6px 14px; border-radius: 4px; color: #f06292; font-weight: 600; opacity: 1; transition: border-color 0.3s, color 0.3s; white-space: nowrap;">PREMIUM HUB</a>` : 
      `<a href="javascript:void(0)" onclick="openPremiumModal()" id="premiumHubBtn" style="border: 1px solid var(--accent-color); padding: 6px 14px; border-radius: 4px; color: var(--accent-color); font-weight: 600; opacity: 1; transition: border-color 0.3s, color 0.3s; white-space: nowrap;">PREMIUM HUB</a>`;
    navLinks.appendChild(li);
  }

  const mobileMenuLinks = document.querySelector('.mobile-menu-links');
  if (mobileMenuLinks && !document.getElementById('premiumHubBtnMobile')) {
    const li = document.createElement('li');
    const isLoggedIn = localStorage.getItem('crave_premium_logged_in') === 'true';
    li.innerHTML = isLoggedIn ? 
      `<a href="premium.html" id="premiumHubBtnMobile" style="color: #f06292; font-weight: 700;">✦ PREMIUM HUB</a>` : 
      `<a href="javascript:void(0)" onclick="closeMobileMenu(); openPremiumModal()" id="premiumHubBtnMobile" style="color: var(--accent-color); font-weight: 700;">✦ PREMIUM HUB</a>`;
    mobileMenuLinks.insertBefore(li, mobileMenuLinks.firstChild);
  }

  if (localStorage.getItem('crave_premium_logged_in') !== 'true') {
    const currentPage = window.location.pathname.split('/').pop();
    const isAtHome = (currentPage === '' || currentPage === 'index.html' || window.location.pathname === '/');
    if (isAtHome && sessionStorage.getItem('premium_modal_dismissed') !== 'true') {
      setTimeout(openPremiumModal, 2500);
    }
  }
});

window.premiumActiveTab = 'signin';

function openPremiumModal() {
  let modal = document.getElementById('premiumAuthModal');
  if (!modal) {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = '#premiumAuthModal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 10000; display: flex; align-items: center; justify-content: center; visibility: hidden; opacity: 0; transition: visibility 0.4s, opacity 0.4s ease; pointer-events: none; } #premiumAuthModal.active { visibility: visible; opacity: 1; pointer-events: auto; } .p-input-focus:focus { border-color: #ff6f3c !important; box-shadow: 0 0 5px rgba(255, 111, 60, 0.3); }';
    document.head.appendChild(styleSheet);

    const container = document.createElement('div');
    container.id = 'premiumAuthModal';
    
    container.innerHTML = `
      <div style="background: rgba(15, 15, 15, 0.95); border: 1px solid rgba(255, 111, 60, 0.2); border-radius: 16px; width: 90%; max-width: 400px; padding: 30px; box-sizing: border-box; box-shadow: 0 20px 50px rgba(0,0,0,0.9); position: relative; display: flex; flex-direction: column; gap: 20px; font-family: 'Inter', sans-serif;">
        <button id="pBtnClose" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #ff6f3c; font-size: 26px; cursor: pointer; transition: transform 0.3s; line-height: 1; padding: 0;">&times;</button>
        
        <div style="text-align: center; margin-bottom: 5px;">
          <span style="font-family: 'Cinzel', serif; font-size: 13px; font-weight: bold; color: #ff6f3c; letter-spacing: 2px;">BLACKPINK CRAVE</span>
          <h2 style="font-family: 'Cinzel', serif; font-size: 22px; font-weight: bold; color: #fff; margin: 5px 0 0 0; letter-spacing: 1px;">PREMIUM HUB</h2>
        </div>
        
        <div style="display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 3px; border-radius: 8px;">
          <button id="pTabSignIn" style="flex: 1; background: #ff6f3c; border: none; color: #fff; font-size: 10.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 8px; border-radius: 6px; cursor: pointer; transition: all 0.3s;">Sign In</button>
          <button id="pTabSignUp" style="flex: 1; background: none; border: none; color: #a1a1aa; font-size: 10.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 8px; border-radius: 6px; cursor: pointer; transition: all 0.3s;">Sign Up</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div id="pNameField" style="display: none; flex-direction: column; gap: 6px;">
            <label style="font-size: 9.5px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Display Name</label>
            <input type="text" id="pInputName" class="p-input-focus" placeholder="Enter your name" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px; color: #fff; font-size: 12px; outline: none; transition: all 0.3s; box-sizing: border-box; width: 100%;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 9.5px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Username / Email</label>
            <input type="text" id="pInputUser" class="p-input-focus" placeholder="Enter email or username" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px; color: #fff; font-size: 12px; outline: none; transition: all 0.3s; box-sizing: border-box; width: 100%;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="font-size: 9.5px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Password</label>
            <input type="password" id="pInputPass" class="p-input-focus" placeholder="Enter password" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px; color: #fff; font-size: 12px; outline: none; transition: all 0.3s; box-sizing: border-box; width: 100%;">
          </div>
        </div>
        
        <button id="pBtnSubmit" style="background: #ff6f3c; border: none; color: #fff; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 12px; border-radius: 6px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(255, 111, 60, 0.3); width: 100%;">Access Premium Hub</button>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; opacity: 0.35; margin: 5px 0;">
          <div style="flex-grow: 1; height: 1px; background: #fff;"></div>
          <span style="font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap;">Or Continue With</span>
          <div style="flex-grow: 1; height: 1px; background: #fff;"></div>
        </div>
        
        <div style="display: flex; gap: 12px; align-items: center;">
          <div id="pBtnGoogleContainer" style="flex: 1; display: flex; justify-content: center; align-items: center; min-height: 40px; overflow: hidden; border-radius: 6px;"></div>
          <button id="pBtnTwitter" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 11px; color: #fff; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.3s; box-sizing: border-box; height: 40px;">
            <img src="https://img.icons8.com/ios-filled/16/ffffff/twitterx.png" alt="X" style="width: 14px; height: 14px;"> Twitter
          </button>
        </div>
        
        <div style="text-align: center; margin-top: 5px;">
          <a id="pLinkContinue" href="javascript:void(0)" style="font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.4); text-decoration: none; text-transform: uppercase; letter-spacing: 1px; transition: color 0.3s;">Continue to Free Standard Mode &rarr;</a>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    modal = container;

    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const gScript = document.createElement('script');
      gScript.src = "https://accounts.google.com/gsi/client";
      gScript.async = true;
      gScript.defer = true;
      document.head.appendChild(gScript);
    }

    const initGoogleInModal = () => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: "235434428018-cbllanjdsac1cv4rtg87b0o9ir5mbr53.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse
        });
        google.accounts.id.renderButton(
          document.getElementById("pBtnGoogleContainer"),
          { theme: "dark", size: "large", shape: "rectangular", text: "signin_with", logo_alignment: "left", width: 175 }
        );
      } else {
        setTimeout(initGoogleInModal, 100);
      }
    };
    initGoogleInModal();

    document.getElementById('pBtnClose').addEventListener('click', closePremiumModal);
    document.getElementById('pTabSignIn').addEventListener('click', () => togglePremiumTab('signin'));
    document.getElementById('pTabSignUp').addEventListener('click', () => togglePremiumTab('signup'));
    document.getElementById('pBtnSubmit').addEventListener('click', handlePremiumSubmit);
    document.getElementById('pBtnTwitter').addEventListener('click', () => handleOAuth('Twitter'));
    document.getElementById('pLinkContinue').addEventListener('click', closePremiumModal);
  }
  
  modal.classList.add('active');
}

function closePremiumModal() {
  const modal = document.getElementById('premiumAuthModal');
  if (modal) {
    modal.classList.remove('active');
  }
  sessionStorage.setItem('premium_modal_dismissed', 'true');
}

function togglePremiumTab(tab) {
  window.premiumActiveTab = tab;
  const tabSignIn = document.getElementById('pTabSignIn');
  const tabSignUp = document.getElementById('pTabSignUp');
  const nameField = document.getElementById('pNameField');
  
  if (tab === 'signin') {
    tabSignIn.style.background = '#ff6f3c';
    tabSignIn.style.color = '#fff';
    tabSignUp.style.background = 'none';
    tabSignUp.style.color = '#a1a1aa';
    nameField.style.display = 'none';
  } else {
    tabSignUp.style.background = '#ff6f3c';
    tabSignUp.style.color = '#fff';
    tabSignIn.style.background = 'none';
    tabSignIn.style.color = '#a1a1aa';
    nameField.style.display = 'flex';
  }
}

function handlePremiumSubmit() {
  const user = document.getElementById('pInputUser').value.trim();
  const pass = document.getElementById('pInputPass').value.trim();
  const name = document.getElementById('pInputName').value.trim();
  
  if (!user || !pass) {
    alert('Please fill in all credentials.');
    return;
  }
  
  if (window.premiumActiveTab === 'signup' && !name) {
    alert('Please enter a display name.');
    return;
  }
  
  const displayName = name || user.split('@')[0];
  localStorage.setItem('crave_premium_logged_in', 'true');
  localStorage.setItem('crave_premium_user_name', displayName);
  window.location.href = 'premium.html';
}

function handleOAuth(provider) {
  const width = 500;
  const height = 600;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  const popup = window.open("", "OAuth Consent", `width=${width},height=${height},left=${left},top=${top}`);
  
  if (!popup) {
    alert("Please enable popups for this site to log in.");
    return;
  }
  
  popup.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sign in - ${provider}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          background-color: #080808;
          color: #f5f5f7;
          font-family: 'Inter', -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
          padding: 20px;
        }
        .card {
          background-color: #111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 40px 30px;
          width: 100%;
          max-width: 360px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          box-sizing: border-box;
        }
        .logo {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 20px;
          display: inline-block;
        }
        h2 {
          font-size: 18px;
          margin: 0 0 8px 0;
          font-weight: 500;
        }
        p {
          font-size: 12px;
          color: #a1a1aa;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }
        .btn {
          background-color: #ff6f3c;
          color: #fff;
          border: none;
          padding: 12px 24px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
          width: 100%;
          transition: opacity 0.2s;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .spinner {
          border: 2px solid rgba(255,255,255,0.1);
          border-top: 2px solid #ff6f3c;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="card" id="consentCard">
        <div class="logo" style="background-color: #222; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
          <span style="font-size: 18px; font-weight: bold; color: #ff6f3c;">${provider[0]}</span>
        </div>
        <h2>Sign in with ${provider}</h2>
        <p><strong>BLACKPINK CRAVE</strong> requests authorization to view your profile.</p>
        <input type="text" id="userInput" placeholder="${provider === 'Google' ? 'Enter Google Email' : 'Enter X (Twitter) Username'}" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 12px; color: #fff; font-size: 13px; outline: none; margin-bottom: 20px; width: 100%; box-sizing: border-box; text-align: center;">
        <button class="btn" onclick="approve()">Approve & Continue</button>
      </div>
      <div class="card" id="loaderCard" style="display: none;">
        <div class="spinner"></div>
        <h2>Connecting...</h2>
        <p>Exchanging secure tokens with ${provider} auth server.</p>
      </div>

      <script>
        function approve() {
          const val = document.getElementById('userInput').value.trim();
          if (!val) {
            alert('Please enter your account details.');
            return;
          }
          const username = val.includes('@') ? val.split('@')[0] : val;
          document.getElementById('consentCard').style.display = 'none';
          document.getElementById('loaderCard').style.display = 'block';
          setTimeout(() => {
            window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${provider}', username: username }, '*');
            window.close();
          }, 1500);
        }
      <\/script>
    </body>
    </html>
  `);
}

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'OAUTH_SUCCESS') {
    localStorage.setItem('crave_premium_logged_in', 'true');
    localStorage.setItem('crave_premium_user_name', event.data.username);
    window.location.href = 'premium.html';
  }
});

function handleGoogleCredentialResponse(response) {
  try {
    const jwt = response.credential;
    const base64Url = jwt.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    localStorage.setItem('crave_premium_logged_in', 'true');
    localStorage.setItem('crave_premium_user_name', payload.name);
    localStorage.setItem('crave_premium_user_email', payload.email);
    if (payload.picture) {
      localStorage.setItem('crave_premium_user_avatar', payload.picture);
    }
    
    window.location.href = 'premium.html';
  } catch (e) {
    console.error("Google authentication JWT processing error:", e);
    alert("Google sign-in error. Please try again.");
  }
}
