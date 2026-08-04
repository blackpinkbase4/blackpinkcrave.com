const fs = require('fs');
const path = require('path');

const artistIds = {
  blackpink: '41MozSoPIsD1dJM0CLPjZF',
  jisoo: '6UZ0ba50XreR4TM8u322gs',
  jennie: '250b0Wlc5Vk0CoUsaCY84M',
  rose: '3eVa5w3URK5duf6eyVDbu9',
  lisa: '5L1lO4eRHmJ7a0Q6csE5cT'
};

function getArtistFromTitle(title) {
  const t = title.toUpperCase();
  if (t.includes('EARTHQUAKE')) return 'JISOO';
  if (t.includes('JENNIE')) return 'JENNIE';
  if (t.includes('TOXIC')) return 'ROSÉ';
  if (t.includes('WORLD')) return 'LISA';
  return 'BLACKPINK';
}

async function fetchArtistKworbData(kworbId) {
  try {
    const url = `https://kworb.net/spotify/artist/${kworbId}_songs.html`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    let totalStreams = 0;
    let dailyStreams = 0;
    
    const streamsMatch = html.match(/Streams<\/td><td>([\d,]+)<\/td>/);
    if (streamsMatch) {
      totalStreams = parseInt(streamsMatch[1].replace(/,/g, ''), 10);
    }
    const dailyMatch = html.match(/Daily<\/td><td>([\d,]+)<\/td>/);
    if (dailyMatch) {
      dailyStreams = parseInt(dailyMatch[1].replace(/,/g, ''), 10);
    }
    
    const tracks = new Map();
    const rowRegex = /<tr><td class="text"><div><a href="https:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)"[^>]*>([^<]+)<\/a><\/div><\/td><td>([\d,]+)<\/td><td>([\d,]+)<\/td><\/tr>/g;
    
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      tracks.set(match[1], {
        title: match[2].trim(),
        streams: parseInt(match[3].replace(/,/g, ''), 10),
        daily: parseInt(match[4].replace(/,/g, ''), 10)
      });
    }
    
    return {
      totalStreams,
      dailyStreams,
      tracks
    };
  } catch (e) {
    return null;
  }
}

async function fetchArtistSpotifyData(spotifyId) {
  try {
    const targetUrl = `https://open.spotify.com/artist/${spotifyId}`;
    const proxyUrl = `https://jgc-api.genius0fts.workers.dev/api/spotify-public?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const html = await res.text();
    
    const mlMatch = html.match(/([\d,]+)\s+monthly listeners/i);
    const folMatch = html.match(/>([\d,]+)<\/p><p[^>]*>Followers<\/p>/i);
    
    return {
      listeners: mlMatch ? parseInt(mlMatch[1].replace(/,/g, ''), 10) : null,
      followers: folMatch ? parseInt(folMatch[1].replace(/,/g, ''), 10) : null
    };
  } catch (e) {
    return null;
  }
}

async function runTracker() {
  const configPath = path.join(__dirname, '../config.json');
  const dbPath = path.join(__dirname, '../stats_database.json');
  
  if (!fs.existsSync(configPath)) return;
  
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    return;
  }
  
  let oldDb = { artists: {}, goals: [] };
  if (fs.existsSync(dbPath)) {
    try {
      oldDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      
    }
  }
  
  const db = {
    lastUpdated: new Date().toISOString(),
    artists: {
      blackpink: {
        name: "BLACKPINK",
        image: "images/slide_stats.jpg",
        profileUrl: "https://open.spotify.com/artist/41MozSoPIsD1dJM0CLPjZF",
        listeners: oldDb.artists?.blackpink?.listeners || 19617289,
        followers: oldDb.artists?.blackpink?.followers || 60258400,
        streams: oldDb.artists?.blackpink?.streams || 17544330965,
        dailyGain: oldDb.artists?.blackpink?.dailyGain || 4790949
      },
      jisoo: {
        name: "JISOO",
        image: "images/slide_jisoo.jpg",
        profileUrl: "https://open.spotify.com/artist/6UZ0ba50XreR4TM8u322gs",
        listeners: oldDb.artists?.jisoo?.listeners || 5099628,
        followers: oldDb.artists?.jisoo?.followers || 9298780,
        streams: oldDb.artists?.jisoo?.streams || 1346595367,
        dailyGain: oldDb.artists?.jisoo?.dailyGain || 626097
      },
      jennie: {
        name: "JENNIE",
        image: "images/slide_jennie.jpg",
        profileUrl: "https://open.spotify.com/artist/250b0Wlc5Vk0CoUsaCY84M",
        listeners: oldDb.artists?.jennie?.listeners || 49144933,
        followers: oldDb.artists?.jennie?.followers || 15821223,
        streams: oldDb.artists?.jennie?.streams || 8098446970,
        dailyGain: oldDb.artists?.jennie?.dailyGain || 7292854
      },
      rose: {
        name: "ROSÉ",
        image: "images/slide_rose.jpg",
        profileUrl: "https://open.spotify.com/artist/3eVa5w3URK5duf6eyVDbu9",
        listeners: oldDb.artists?.rose?.listeners || 26155096,
        followers: oldDb.artists?.rose?.followers || 15730595,
        streams: oldDb.artists?.rose?.streams || 5623123514,
        dailyGain: oldDb.artists?.rose?.dailyGain || 3387360
      },
      lisa: {
        name: "LISA",
        image: "images/slide_lisa.jpg",
        profileUrl: "https://open.spotify.com/artist/5L1lO4eRHmJ7a0Q6csE5cT",
        listeners: oldDb.artists?.lisa?.listeners || 13580139,
        followers: oldDb.artists?.lisa?.followers || 15850536,
        streams: oldDb.artists?.lisa?.streams || 5377576555,
        dailyGain: oldDb.artists?.lisa?.dailyGain || 2331012
      }
    },
    goals: []
  };
  
  const allParsedTracks = new Map();
  
  for (const [artistKey, id] of Object.entries(artistIds)) {
    const kworbData = await fetchArtistKworbData(id);
    const spotifyData = await fetchArtistSpotifyData(id);
    
    const art = db.artists[artistKey];
    if (kworbData) {
      art.streams = kworbData.totalStreams;
      art.dailyGain = kworbData.dailyStreams;
      for (const [trackId, trackInfo] of kworbData.tracks.entries()) {
        allParsedTracks.set(trackId, trackInfo);
      }
    }
    if (spotifyData) {
      if (spotifyData.listeners) art.listeners = spotifyData.listeners;
      if (spotifyData.followers) art.followers = spotifyData.followers;
    }
  }
  
  const configGoals = [];
  if (config.stats) {
    config.stats.forEach(item => {
      configGoals.push({ ...item, isSolo: false });
    });
  }
  if (config.soloStats) {
    config.soloStats.forEach(item => {
      configGoals.push({ ...item, isSolo: true });
    });
  }
  
  configGoals.forEach(item => {
    const link = item.spotify || '';
    const match = link.match(/\/track\/([a-zA-Z0-9]+)/);
    if (!match) return;
    
    const trackId = match[1];
    const artist = getArtistFromTitle(item.title);
    const target = parseInt(item.goal.replace(/,/g, ''), 10);
    
    const oldGoal = oldDb.goals?.find(g => g.id === trackId);
    let history = oldGoal ? oldGoal.history : [];
    
    const liveTrack = allParsedTracks.get(trackId);
    let currentStreams = oldGoal ? oldGoal.streams : parseInt(item.streams.replace(/,/g, ''), 10);
    let dailyGain = oldGoal ? oldGoal.dailyGain : parseInt((item.daily || '0').replace(/,/g, ''), 10);
    
    if (liveTrack) {
      currentStreams = liveTrack.streams;
      dailyGain = liveTrack.daily;
    }
    
    history.push(currentStreams);
    if (history.length > 7) {
      history.shift();
    }
    
    const weeklyGain = history.length >= 7 ? (currentStreams - history[0]) : (oldGoal?.weeklyGain || 0);
    
    db.goals.push({
      id: trackId,
      title: item.title,
      artist: artist,
      streams: currentStreams,
      target: target,
      dailyGain: dailyGain,
      weeklyGain: weeklyGain,
      history: history,
      spotify: link
    });
  });
  
  db.lastUpdated = new Date().toISOString();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

runTracker();
