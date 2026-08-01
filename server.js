const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/save-config')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'config.json'), JSON.stringify(data, null, 2), 'utf8');
        try {
          const { exec } = require('child_process');
          exec('node ' + path.join(PUBLIC_DIR, 'scripts', 'spotify_scraper.js'), (err) => {
            if (err) {
              console.error('Failed to run scraper:', err);
            }
          });
        } catch (e) {
          console.error('Error starting scraper process:', e);
        }
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true, message: 'Config saved locally' }));
      } catch (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, req.url.split('?')[0]);
  if (filePath === PUBLIC_DIR || filePath === PUBLIC_DIR + path.sep) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  const runScraper = () => {
    try {
      const { exec } = require('child_process');
      exec('node ' + path.join(PUBLIC_DIR, 'scripts', 'spotify_scraper.js'), (err) => {
        if (err) {
          console.error('Failed to run scraper:', err);
        }
      });
    } catch (e) {
      console.error('Error starting scraper:', e);
    }
  };
  runScraper();
  setInterval(runScraper, 43200000);
});
