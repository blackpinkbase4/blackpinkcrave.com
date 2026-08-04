const now = new Date();

let demoEvents = [
  {
    id: 1784379645569,
    title: "JENNIE - Lollapalooza Chicago Festival Performance",
    desc: "Music Festival schedule for JENNIE. Details: JENNIE - Lollapalooza Chicago Festival Performance.",
    member: "jennie",
    category: "brand",
    startISO: "2026-08-01T12:00:00.000Z",
    endISO: "2026-08-01T14:00:00.000Z",
    streamUrl: "https://www.lollapalooza.com/"
  },
  {
    id: 1784379704784,
    title: "LISA - \"Always LALISA\" Official Documentary Release",
    desc: "Movie schedule for LISA. Details: LISA - \"Always LALISA\" Official Documentary Release.",
    member: "lisa",
    category: "rel",
    startISO: "2027-08-01T12:00:00.000Z",
    endISO: "2027-08-01T14:00:00.000Z",
    streamUrl: "https://www.tiff.net/films/always-lalisa"
  },
  {
    id: 1784379779270,
    title: "JENNIE - Summer Sonic Tokyo",
    desc: "Music Festival schedule for JENNIE. Details: JENNIE - Summer Sonic Tokyo.",
    member: "jennie",
    category: "brand",
    startISO: "2026-08-14T12:00:00.000Z",
    endISO: "2026-08-14T14:00:00.000Z",
    streamUrl: "#"
  },
  {
    id: 1784379859558,
    title: "LISA - \"Viva La Lisa\" Las Vegas Residency (Opening Weekend)",
    desc: "Concert Residency schedule for LISA. Details: LISA - \"Viva La Lisa\" Las Vegas Residency (Opening Weekend).",
    member: "lisa",
    category: "perf",
    startISO: "2026-11-13T12:00:00.000Z",
    endISO: "2026-11-13T14:00:00.000Z",
    streamUrl: "#"
  },
  {
    id: 1784474179408,
    title: "JENNIE - Less than a Lover",
    desc: "Music schedule for JENNIE. Details: JENNIE - Less than a Lover.",
    member: "jennie",
    category: "rel",
    startISO: "2026-07-24T12:00:00.000Z",
    endISO: "2026-07-24T14:00:00.000Z",
    streamUrl: "https://x.com/jennierubyjane/status/2079221159078343137?s=20"
  }
];

let currentYear = now.getFullYear();
let currentMonth = now.getMonth();
let selectedDateStr = formatDateKey(now);

function parseScheduleDate(dateStr, timeStr, timezoneStr) {
  if (!dateStr) return null;
  let cleanStr = dateStr.replace(/[.\u2013\u2014]/g, '').trim();
  let parts = cleanStr.split(/[-–]/);
  let baseDateStr = parts[0];
  const yearMatch = cleanStr.match(/\d{4}/);
  if (yearMatch && !baseDateStr.includes(yearMatch[0])) {
    baseDateStr += " " + yearMatch[0];
  }
  
  let dateTimeStr = baseDateStr;
  if (timeStr && timeStr.trim() !== '') {
    dateTimeStr += " " + timeStr.trim();
  } else {
    dateTimeStr += " 12:00";
  }

  if (timezoneStr === 'KST') {
    dateTimeStr += " GMT+0900";
  } else if (timezoneStr === 'UTC') {
    dateTimeStr += " GMT+0000";
  }

  const d = new Date(dateTimeStr);
  if (!isNaN(d.getTime())) return d;

  const fallback = new Date(baseDateStr);
  if (!isNaN(fallback.getTime())) {
    fallback.setHours(12, 0, 0, 0);
    return fallback;
  }
  return null;
}

async function loadLiveSchedules() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error();
    const config = await res.json();
    if (config.ticker) {
      localStorage.setItem('crave_ticker_overrides', JSON.stringify(config.ticker));
      renderCraveTicker();
    }
    if (config.schedules && Array.isArray(config.schedules)) {
      demoEvents = config.schedules.map((item, index) => {
        const parsedDate = parseScheduleDate(item.date, item.time, item.timezone);
        
        let member = 'group';
        const txt = item.event.toLowerCase();
        if (txt.includes('lisa')) member = 'lisa';
        else if (txt.includes('jennie')) member = 'jennie';
        else if (txt.includes('rose') || txt.includes('rosé')) member = 'rose';
        else if (txt.includes('jisoo')) member = 'jisoo';
        
        let category = 'perf';
        const cat = item.category ? item.category.toLowerCase() : '';
        if (cat.includes('fashion') || cat.includes('brand') || cat.includes('show')) category = 'brand';
        else if (cat.includes('birthday') || cat.includes('fan')) category = 'bday';
        else if (cat.includes('music') || cat.includes('single') || cat.includes('album') || cat.includes('release') || cat.includes('mv') || cat.includes('song')) category = 'rel';
        
        let startISO = new Date().toISOString();
        if (parsedDate) {
          startISO = parsedDate.toISOString();
        } else {
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 1);
          startISO = futureDate.toISOString();
        }
        
        return {
          id: item.id || index,
          title: item.event,
          desc: `${item.category || 'Event'} schedule for BLACKPINK ${member.toUpperCase()}. Details: ${item.event}.`,
          member: member,
          category: category,
          startISO: startISO,
          endISO: parsedDate ? new Date(parsedDate.getTime() + 2 * 60 * 60 * 1000).toISOString() : new Date().toISOString()
        };
      });
    }
  } catch (e) {
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  renderCraveTicker();
  detectTimezone();
  await loadLiveSchedules();
  renderCalendar();
  showDayEvents(now);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'light') {
      document.body.setAttribute('data-theme', 'light');
      themeToggleBtn.textContent = '🌑';
    } else {
      themeToggleBtn.textContent = '☀️';
    }
    
    themeToggleBtn.addEventListener('click', () => {
      if (document.body.getAttribute('data-theme') === 'light') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.textContent = '☀️';
      } else {
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.textContent = '🌑';
      }
    });
  }

  const menuToggle = document.getElementById('menuToggleBtn');
  const menuClose = document.getElementById('mobileMenuCloseBtn');
  const menuBackdrop = document.getElementById('mobileMenuBackdrop');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.getElementById('mobileMenuOverlay').classList.add('active');
      document.getElementById('mobileMenuBackdrop').classList.add('active');
    });
  }
  
  window.closeMobileMenu = function() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const backdrop = document.getElementById('mobileMenuBackdrop');
    if (overlay) overlay.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  };
  
  if (menuClose) {
    menuClose.addEventListener('click', closeMobileMenu);
  }
  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMobileMenu);
  }

  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  const notifBtn = document.getElementById('subscribeNotificationsBtn');
  if (notifBtn) {
    if (Notification.permission === 'granted') {
      notifBtn.textContent = 'Alerts Enabled ✓';
      notifBtn.style.background = 'var(--accent)';
      notifBtn.style.color = '#000';
    }

    notifBtn.addEventListener('click', () => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          notifBtn.textContent = 'Alerts Enabled ✓';
          notifBtn.style.background = 'var(--accent)';
          notifBtn.style.color = '#000';
          
          const notification = new Notification("BLACKPINK CRAVE Schedule Alert", {
            body: "🔴 LISA's 'Rockstar' Music Video is releasing now! Check schedules page for full local times.",
            icon: 'images/logo.jpg',
            tag: 'lisa-mv-release-demo'
          });
        } else {
          alert("Notification permission denied. Please reset your browser site settings to test push alerts.");
        }
      });
    });
  }

  setInterval(evaluateLiveStates, 10000);
});

function detectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.getElementById('userTzLabel').textContent = tz || 'UTC';
  } catch (e) {
    document.getElementById('userTzLabel').textContent = 'Local Time';
  }
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderCalendar() {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  document.getElementById('calendarMonthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const grid = document.getElementById('calendarDaysGrid');
  const cells = grid.querySelectorAll('.day-cell');
  cells.forEach(c => c.remove());

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const cell = document.createElement('div');
    cell.classList.add('day-cell', 'other-month');
    cell.textContent = d;
    grid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(currentYear, currentMonth, d);
    const dateStr = formatDateKey(cellDate);
    
    const cell = document.createElement('div');
    cell.classList.add('day-cell');
    cell.textContent = d;

    const isToday = cellDate.toDateString() === now.toDateString();
    if (isToday) {
      cell.classList.add('today');
    }

    if (dateStr === selectedDateStr) {
      cell.classList.add('selected');
    }

    const dayEvents = demoEvents.filter(ev => {
      const evDate = new Date(ev.startISO);
      return formatDateKey(evDate) === dateStr;
    });

    if (dayEvents.length > 0) {
      const dotsHolder = document.createElement('div');
      dotsHolder.classList.add('dots-holder');
      
      const addedMembers = new Set();
      dayEvents.forEach(ev => {
        if (!addedMembers.has(ev.member)) {
          addedMembers.add(ev.member);
          const dot = document.createElement('div');
          dot.classList.add('event-dot', ev.member);
          dotsHolder.appendChild(dot);
        }
      });
      cell.appendChild(dotsHolder);
    }

    cell.addEventListener('click', () => {
      grid.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      selectedDateStr = dateStr;
      showDayEvents(cellDate);
    });

    grid.appendChild(cell);
  }

  const totalCells = firstDay + daysInMonth;
  const nextMonthDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= nextMonthDays; d++) {
    const cell = document.createElement('div');
    cell.classList.add('day-cell', 'other-month');
    cell.textContent = d;
    grid.appendChild(cell);
  }
}

function showDayEvents(date) {
  const dateStr = formatDateKey(date);
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('selectedDateLabel').textContent = date.toLocaleDateString(undefined, options);

  const container = document.getElementById('dayEventsContainer');
  container.innerHTML = '';

  const dayEvents = demoEvents.filter(ev => {
    const evDate = new Date(ev.startISO);
    return formatDateKey(evDate) === dateStr;
  });

  if (dayEvents.length === 0) {
    container.innerHTML = '<div class="no-events">No schedule events listed for this date.</div>';
    return;
  }

  dayEvents.forEach(ev => {
    const card = document.createElement('div');
    card.classList.add('event-card');
    card.setAttribute('data-event-id', ev.id);

    const start = new Date(ev.startISO);
    const end = new Date(ev.endISO);
    const tNow = new Date();

    const isLive = tNow >= start && tNow <= end;
    if (isLive) {
      card.classList.add('live-active');
    }

    let badgeClass = 'perf';
    let badgeText = 'Live Stage / Performance';
    if (ev.category === 'brand') { badgeClass = 'brand'; badgeText = 'Fashion Show / Brand'; }
    if (ev.category === 'bday') { badgeClass = 'bday'; badgeText = 'Birthday / Fanmeet'; }
    if (ev.category === 'rel') { badgeClass = 'rel'; badgeText = 'Music Video / Release'; }

    const formattedLocalStart = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const formattedLocalEnd = end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const formattedKstStart = start.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });
    const formattedKstEnd = end.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });

    let liveBadgeHtml = isLive ? `<span class="live-badge"><span>🔴</span> LIVE NOW</span>` : '';

    card.innerHTML = `
      <div class="event-meta">
        <span class="badge ${badgeClass}">${badgeText}</span>
        ${liveBadgeHtml}
        <span class="member-owner ${ev.member}">${ev.member.toUpperCase()}</span>
      </div>
      <h4 class="event-title">${ev.title}</h4>
      <p class="event-desc">${ev.desc}</p>
      
      <div class="event-time-box">
        <div class="time-row">
          <span class="time-label">Your Time ⏰</span>
          <span class="time-val local">${formattedLocalStart} - ${formattedLocalEnd}</span>
        </div>
        <div class="time-row">
          <span class="time-label">Seoul Time (KST) 🇰🇷</span>
          <span class="time-val">${formattedKstStart} - ${formattedKstEnd}</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function evaluateLiveStates() {
  const cards = document.querySelectorAll('.event-card');
  const tNow = new Date();
  
  cards.forEach(card => {
    const id = parseInt(card.getAttribute('data-event-id'));
    const ev = demoEvents.find(e => e.id === id);
    if (!ev) return;

    const start = new Date(ev.startISO);
    const end = new Date(ev.endISO);
    const isLive = tNow >= start && tNow <= end;

    const currentlyLive = card.classList.contains('live-active');
    if (isLive !== currentlyLive) {
      const selectedDay = new Date(selectedDateStr);
      showDayEvents(selectedDay);
    }
  });
}

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
