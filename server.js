import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import assert from 'node:assert';
import { YtDlp } from 'ytdlp-nodejs';
const ytdlp = new YtDlp();
const PROCESS_DIRECTORY = process.cwd();

process.on('unhandledRejection', err => {
  console.error('UNHANDLED PROMISE:', err);
});
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

let INDEX_HTML = fs.readFileSync(path.join(PROCESS_DIRECTORY, 'index.html'));
function get_apis() {
  try {
    return JSON.parse(fs.readFileSync('/etc/secrets/api_secrets.json', 'utf-8'));
  } catch (err) {
    return JSON.parse(fs.readFileSync('../../../shared_app_info/api_secrets.json', 'utf-8'))
  }
}
const APIS = get_apis();
let pool = null;
try {
  pool = mysql.createPool(APIS.SQL_INFO);
} catch(err) {}
const LAST_FM_URL = "http://ws.audioscrobbler.com/2.0/";
const LIKED_SONGS_PLAYLIST = 1;
const JSON_EMPTY = "{}";
async function get_spotify_access_token() {
  const authHeader = 'Basic ' + Buffer.from(`${APIS.SPOTIFY_CLIENT_ID}:${APIS.SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }) // form-encoded
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = await response.json();
  return data; // { access_token, token_type, expires_in }
}
const SPOTIFY_ACCESS_TOKEN = await get_spotify_access_token();

function get_content_type(ext) {
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
function apply_CORS(req, res) {
  const allowedOrigin = 'http://34.58.86.86:3000';
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
async function get_streamable_url(video_id) {
  const info = await ytdlp.getInfoAsync(video_id);
  // Find the best audio-only format
  // Filtering for formats that have a URL and are marked as 'audio only'
  const audioFormat = info.formats
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0]; // Sort by highest bitrate

  if (audioFormat) {
      return audioFormat.url;
  } else {
      throw new Error('No audio-only format found.');
  }
}
function create_tables() {
  // CREATE TABLE songs (
  //     id INT AUTO_INCREMENT PRIMARY KEY,
  //     title VARCHAR(255) NOT NULL,
  //     artist VARCHAR(255) NOT NULL,
  //     youtube_id VARCHAR(20) NOT NULL UNIQUE
  // );

  // CREATE TABLE playlists (
  //     id INT AUTO_INCREMENT PRIMARY KEY,
  //     name VARCHAR(255) NOT NULL,
  //     description TEXT,
  //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  // );

  // CREATE TABLE playlist_songs (
  //     id INT AUTO_INCREMENT PRIMARY KEY,
  //     playlist_id INT NOT NULL, 
  //     song_id INT NOT NULL, 
  //     position INT NOT NULL, 
  //     added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  //     FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE, 
  //     FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE, 
  //     UNIQUE (playlist_id, song_id), 
  //     UNIQUE (playlist_id, position) 
  // );
}

async function print_sql_info() {
  // await pool.query('DELETE FROM songs');
  // await pool.query(`ALTER TABLE songs AUTO_INCREMENT = 1`);
  // await pool.query('DELETE FROM playlist_songs');
  // await pool.query('DELETE FROM playlists;');
  // await pool.query(`ALTER TABLE playlists AUTO_INCREMENT = 1`);
  // await pool.query(`INSERT INTO playlists (name, description) VALUES ('Liked Songs', 'Songs that you have liked')`)
  // const [rows] = await pool.query('SELECT * FROM songs');
  // console.log(rows);
  // const [row2] = await pool.query('SELECT * FROM playlists');
  // console.log(row2);
}
print_sql_info();

const server = http.createServer(async (req, res) => {
  console.log(req.url);
  if (apply_CORS(req, res)) return;

  const url = req.url;
  const method = req.method;

  const match = req.url.match(/^\/track_info\/(.+)$/);
  if (match && method == 'GET') {
    const mbid = match[1];
    const params = new URLSearchParams({
      method: 'track.getinfo',
      api_key: APIS.LAST_FM_API_KEY,
      format: 'json',
      mbid
    });

    try {
      const response = await fetch(`${LAST_FM_URL}?${params.toString()}`);
      const text = await response.text();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(text);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch track info' }));
    }
    return;
  }
  const yt_match = req.url.match(/^\/search\/(.+)$/);
  if (yt_match && method == 'GET') {
    // console.log(yt_match);

    let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${yt_match[1]}&key=${APIS.YOUTUBE_API_KEY}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(await response.text());

    return;
  }
  if (url === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(INDEX_HTML);
  }
  else if (url === '/save_song' && method === 'POST') {
    let body = '';

    // collect chunks
    req.on('data', chunk => {
      console.log("DATA");
      body += chunk;
    });

    // when finished
    req.on('end', async () => {
      const lines = body.split('\n');

      await pool.execute('INSERT IGNORE INTO songs (title, artist, youtube_id) VALUES (?, ?, ?)', lines);

      const [rows] = await pool.execute('SELECT id FROM songs WHERE youtube_id = ?', [lines[2]]);
      console.log(rows);

      const [next_position] = await pool.execute('SELECT COALESCE(MAX(position) + 1, 0) AS next_pos FROM playlist_songs WHERE playlist_id = ?', [LIKED_SONGS_PLAYLIST]);
      console.log("next position :: ", next_position[0].next_pos);

      try {
        await pool.execute(`INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)`, [LIKED_SONGS_PLAYLIST, rows[0].id, next_position[0].next_pos]);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON_EMPTY);
      } catch (err) {
        if ("code" in err && err.code == "ER_DUP_ENTRY") {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({
            message: "DUPLICATE",
            title: lines[0],
          }));
        } else {
          throw err;
        }
      }
    });
    // handle errors
    req.on('error', err => {
      console.error(err);
      res.writeHead(500);
      res.end('Server error');
    });
  }
  else if (url =='/saved_songs' && method == 'GET') {
    if (pool == null) return;
    const [result] = await pool.execute(`
      SELECT
        s.id AS song_id,
        s.title,
        s.artist,
        s.youtube_id,
        ps.position,
        ps.added_at
      FROM playlist_songs ps
      JOIN songs s ON ps.song_id = s.id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position ASC
      `, [LIKED_SONGS_PLAYLIST]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  }
  else if (url === '/token' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(SPOTIFY_ACCESS_TOKEN));
  }
  else if (url === '/top_tracks' && method === 'GET') {
    const params = {
      method: 'chart.gettoptracks',
      api_key: APIS.LAST_FM_API_KEY,
      format: 'json',
      limit: 20
    };
    const queryString = new URLSearchParams(params).toString();
    const url = `${LAST_FM_URL}?${queryString}`;
    // console.log(url);

    fetch(url).then(response => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      response.json().then(data => {
        // console.log(data);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
      });
    });
  }
  else if (url.startsWith('/url/') && method == 'GET') {
    const video_id = decodeURIComponent(url.replace('/url/', ''));
    const streamable_url = await get_streamable_url(video_id);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({url: streamable_url}));
  }
  else if (url.startsWith('/stream/') && method === 'GET') {
    const audioDir = path.join(PROCESS_DIRECTORY, 'public/audio');

    // decode URL (%20, etc)
    const filename = decodeURIComponent(url.replace('/stream/', ''));

    const audioPath = path.join(audioDir, filename);
    const resolvedPath = path.resolve(audioPath);

    // enforce sandbox
    if (!resolvedPath.startsWith(audioDir + path.sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(resolvedPath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end('Audio not found');
        return;
      }

      const range = req.headers.range;
      if (!range) {
        res.writeHead(416);
        res.end('Range header required');
        return;
      }

      const ext = path.extname(resolvedPath);
      const contentType = get_content_type(ext);
      const fileSize = stat.size;

      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`
        });
        res.end();
        return;
      }

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType
      });

      fs.createReadStream(resolvedPath, { start, end }).pipe(res);
    });
  }
  else if (url.startsWith('/') && method === 'GET') {
    const publicDir = path.join(PROCESS_DIRECTORY, 'public');

    // Decode URL (%20, etc)
    const requestPath = decodeURIComponent(url.slice(1));

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
        const contentType = get_content_type(ext);

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