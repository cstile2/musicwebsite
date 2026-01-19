const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const filePath = path.join(__dirname, 'index.html');

function getContentType(ext) {
  switch (ext) {
    case '.html': return 'text/html';
    case '.js':   return 'application/javascript';
    case '.css':  return 'text/css';
    case '.json': return 'application/json';
    case '.png':  return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg':  return 'image/svg+xml';
    default:      return 'application/octet-stream';
  }
}
function applyCORS(req, res) {
  const allowedOrigin = 'http://localhost:3000';
  const origin = req.headers.origin;

  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true; // request handled
  }

  return false;
}

// Read the file asynchronously
let index_html = fs.readFileSync(filePath);

const server = http.createServer((req, res) => {
  if (applyCORS(req, res)) return;

  const url = req.url;
  const method = req.method;

  if (url === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(index_html);
  }
  else if (url === '/saved_songs' && method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ message: "Data received successfully" }));
  }
  else if (url.startsWith('/') && method === 'GET') {
    const publicDir = path.join(__dirname, 'public');

    // Decode URL (%20, etc)
    const requestPath = decodeURIComponent(url.slice(1));
    console.log(requestPath);

    // Resolve and normalize path
    const filePath = path.join(publicDir, requestPath);
    const resolvedPath = path.resolve(filePath);

    // Security: prevent ../ attacks
    if (!resolvedPath.startsWith(publicDir + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(resolvedPath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      fs.readFile(resolvedPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }

        const ext = path.extname(resolvedPath);
        const contentType = getContentType(ext);

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });
  }
  else {
    // Fallback for unknown routes (404)
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});