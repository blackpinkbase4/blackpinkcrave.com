const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeKworb(url) {
  const html = await fetchUrl(url);
  const regex = /<a href="https:\/\/open\.spotify\.com\/track\/([^"]+)">([^<]+)<\/a><\/td><td>([^<]+)<\/td><td>([^<]+)<\/td>/g;
  const songs = {};
  let match;
  while ((match = regex.exec(html)) !== null) {
    const trackId = match[1];
    const title = match[2];
    const streams = match[3];
    const daily = match[4];
    songs[title] = {
      url: `https://open.spotify.com/track/${trackId}`,
      streams: streams,
      daily: daily
    };
  }
  return songs;
}

module.exports = async (req, res) => {
  const cronAuth = req.headers['authorization'];
  if (process.env.VERCEL_ENV === 'production' && cronAuth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bpUrl = 'https://kworb.net/spotify/artist/41MozSoPIsD1dJM0CLPjZF_songs.html';
    const bpSongs = await scrapeKworb(bpUrl);
    
    let totalStreamsSum = 0;
    for (const title in bpSongs) {
      const streamsVal = parseInt(bpSongs[title].streams.replace(/,/g, ''), 10);
      if (!isNaN(streamsVal)) totalStreamsSum += streamsVal;
    }

    const payload = {
      fields: {
        total_streams: { stringValue: totalStreamsSum.toLocaleString() },
        songs: {
          mapValue: {
            fields: Object.keys(bpSongs).reduce((acc, title) => {
              acc[title] = {
                mapValue: {
                  fields: {
                    url: { stringValue: bpSongs[title].url },
                    streams: { stringValue: bpSongs[title].streams },
                    daily: { stringValue: bpSongs[title].daily }
                  }
                }
              };
              return acc;
            }, {})
          }
        }
      }
    };

    const projectId = process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID";
    const apiKey = process.env.FIREBASE_API_KEY || "YOUR_API_KEY";
    
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/(default)/documents/stats/blackpink?key=${apiKey}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const writeReq = https.request(options, (writeRes) => {
      let responseBody = '';
      writeRes.on('data', chunk => responseBody += chunk);
      writeRes.on('end', () => {
        res.status(200).json({ success: true, message: 'Scraped and saved to Firebase REST API' });
      });
    });

    writeReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
    });

    writeReq.write(postData);
    writeReq.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
