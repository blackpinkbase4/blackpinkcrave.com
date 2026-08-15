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
            if (err) console.error('Failed to run spotify_scraper.js:', err);
          });
          exec('python ' + path.join(PUBLIC_DIR, 'update_stats.py'), (err) => {
            if (err) console.error('Failed to run update_stats.py:', err);
          });
          exec('python ' + path.join(PUBLIC_DIR, 'update_charts.py'), (err) => {
            if (err) console.error('Failed to run update_charts.py:', err);
          });
        } catch (e) {
          console.error('Error starting scrapers process:', e);
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

  if (req.method === 'POST' && req.url.startsWith('/api/verify-admin')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.password === 'crave2026') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: true, token: 'crave_auth_token_2026' }));
        } else {
          res.writeHead(401, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
        }
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

  if (req.method === 'POST' && req.url.startsWith('/api/save-news')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newsFile = path.join(PUBLIC_DIR, 'news_database.json');
        let newsList = [];
        if (fs.existsSync(newsFile)) {
          newsList = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
        }
        if (data.id) {
          const index = newsList.findIndex(item => item.id === parseInt(data.id, 10));
          if (index !== -1) {
            newsList[index].title = data.title;
            newsList[index].image = data.image;
            newsList[index].snippet = data.snippet;
            newsList[index].content = data.content;
            newsList[index].author = data.author || 'BLINK';
          }
        } else {
          const nextId = newsList.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
          const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const newItem = {
            id: nextId,
            title: data.title,
            date: todayStr,
            image: data.image,
            snippet: data.snippet,
            content: data.content,
            author: data.author || 'BLINK'
          };
          newsList.unshift(newItem);
        }
        fs.writeFileSync(newsFile, JSON.stringify(newsList, null, 2), 'utf8');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
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

  if (req.method === 'POST' && req.url.startsWith('/api/delete-news')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newsFile = path.join(PUBLIC_DIR, 'news_database.json');
        if (fs.existsSync(newsFile)) {
          let newsList = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
          newsList = newsList.filter(item => item.id !== parseInt(data.id, 10));
          fs.writeFileSync(newsFile, JSON.stringify(newsList, null, 2), 'utf8');
        }
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true }));
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
  const runScrapers = () => {
    try {
      const { exec } = require('child_process');
      console.log(`[${new Date().toISOString()}] Starting scheduled scraper tasks...`);
      exec('node ' + path.join(PUBLIC_DIR, 'scripts', 'spotify_scraper.js'), (err) => {
        if (err) console.error('Failed to run spotify_scraper.js:', err);
        else console.log('spotify_scraper.js completed successfully.');
      });
      exec('python ' + path.join(PUBLIC_DIR, 'update_stats.py'), (err) => {
        if (err) console.error('Failed to run update_stats.py:', err);
        else console.log('update_stats.py completed successfully.');
      });
      exec('python ' + path.join(PUBLIC_DIR, 'update_charts.py'), (err) => {
        if (err) console.error('Failed to run update_charts.py:', err);
        else console.log('update_charts.py completed successfully.');
      });
    } catch (e) {
      console.error('Error starting scrapers:', e);
    }
  };


  runScrapers();


  const scheduleNextDailyRun = () => {
    const now = new Date();
    const nextRun = new Date(now);


    nextRun.setHours(24, 0, 0, 0);

    const delay = nextRun.getTime() - now.getTime();
    console.log(`Scrapers scheduled to run next at: ${nextRun.toString()} (in ${(delay / 1000 / 60).toFixed(1)} minutes)`);

    setTimeout(() => {
      runScrapers();

      setInterval(runScrapers, 86400000);
    }, delay);
  };
  scheduleNextDailyRun();
});
