from flask import Flask, request, send_file, Response, abort, redirect, jsonify, render_template
from flask_cors import CORS
import requests
import base64
import os
import yt_dlp
import mysql.connector

# CREATE TABLE playlists (
#     id INT AUTO_INCREMENT PRIMARY KEY,

#     name VARCHAR(255) NOT NULL,
#     description TEXT,
#     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# );

# CREATE TABLE songs (
#     id INT AUTO_INCREMENT PRIMARY KEY,

#     title VARCHAR(255) NOT NULL,
#     artist VARCHAR(255) NOT NULL,
#     youtube_id VARCHAR(20) NOT NULL UNIQUE
# );

# CREATE TABLE playlist_songs (
#     id INT AUTO_INCREMENT PRIMARY KEY,

#     playlist_id INT NOT NULL, 
#     song_id INT NOT NULL, 
#     position INT NOT NULL, 
#     added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
#     FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE, 
#     FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE, 
#     UNIQUE (playlist_id, song_id), 
#     UNIQUE (playlist_id, position) 
# );


# INSERT INTO playlists (name, description)
# VALUES ('Chill Vibes', 'Relaxing songs for the evening');

# INSERT INTO playlist_songs (playlist_id, song_id, position)
# VALUES (1, 1, 0);
# INSERT INTO playlist_songs (playlist_id, song_id, position)
# VALUES (1, 2, 1);

# SELECT 
#     ps.position,
#     s.id AS song_id,
#     s.title,
#     s.artist,
#     s.youtube_id,
#     ps.added_at
# FROM playlist_songs ps
# JOIN songs s ON ps.song_id = s.id
# WHERE ps.playlist_id = 2
# ORDER BY ps.position ASC;

# while True:
#     string = ""
#     while True:
#         line = input(">>>")
#         if line == "END" or line == "":
#             break
#         string += line + " "
#     print("::: ", string)
#     mycursor.execute(string)
#     myresult = mycursor.fetchall()
#     for x in myresult:
#         print(x)

#     if mycursor.with_rows:  # only fetch if it's a SELECT or similar
#         myresult = mycursor.fetchall()
#         for x in myresult:
#             print(x)

#     mydb.commit()


LAST_FM_ROOT = "http://ws.audioscrobbler.com/2.0/"

def get_audio_url(video_url: str) -> str:
    ydl_opts = {
        # "format": "bestaudio/best",  # pick best available audio-only stream
        "format": "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio[ext=wav]",
        "quiet": True,               # suppress console output
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=False)
        return info["url"]
def get_file_path(filename):
    path = os.path.join("audio", filename)
    if not os.path.exists(path):
        abort(404)
    return path
def get_spotify_token():
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode(),
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    response = requests.post(url, headers=headers, data=data)
    return response.text

app = Flask(__name__)
CORS(app)

@app.route('/audio_stream/<filename>', methods=['GET'])
def stream_audio(filename):
    path = get_file_path(filename)
    file_size = os.path.getsize(path)
    range_header = request.headers.get('Range', None)
    
    if range_header:
        # Parse Range header: bytes=start-end
        bytes_range = range_header.strip().split('=')[1]
        start_str, end_str = bytes_range.split('-')
        start = int(start_str)
        end = int(end_str) if end_str else file_size - 1
        length = end - start + 1
        
        with open(path, 'rb') as f:
            f.seek(start)
            chunk = f.read(length)
        
        content_type = 'audio/flac' if path.endswith('.flac') else 'audio/wav'
        rv = Response(chunk, 206, mimetype=content_type, direct_passthrough=True)
        rv.headers.add('Content-Range', f'bytes {start}-{end}/{file_size}')
        rv.headers.add('Accept-Ranges', 'bytes')
        rv.headers.add('Content-Length', str(length))
        return rv
    else:
        # No range requested: send full file
        return send_file(path, as_attachment=False)
    
@app.route('/url/<video_id>', methods=['GET'])
def URL(video_id):
    url = get_audio_url(video_id)
    rv = Response(url, 200, mimetype="text/plain")
    return rv

@app.route("/token", methods=['GET'])
def token():
    token_data = get_spotify_token()
    return token_data

@app.route('/save_song', methods=['POST'])
def save_song():
    text = request.get_data().decode("utf-8")
    lines = text.split('\n')
    sql = "INSERT IGNORE INTO songs (title, artist, youtube_id) VALUES (%s, %s, %s)"
    val = (lines[0], lines[1], lines[2])
    mycursor.execute(sql, val)
    mydb.commit()

    _sql = "SELECT id FROM songs WHERE youtube_id = %s"
    _val = (lines[2],)
    mycursor.execute(_sql, _val)
    myresult = mycursor.fetchone()

    playlist_id = 2

    mycursor.execute("SELECT COALESCE(MAX(position) + 1, 0) FROM playlist_songs WHERE playlist_id = %s", (playlist_id,))
    next_position = mycursor.fetchone()[0]

    sql2 = """
        INSERT INTO playlist_songs (playlist_id, song_id, position)
        VALUES (%s, %s, %s)
    """
    val2 = (playlist_id, myresult[0], next_position)
    mycursor.execute(sql2, val2)
    mydb.commit()
        
    return Response(status=200)

@app.route('/saved_songs', methods=['GET'])
def saved_songs():
    playlist_id = 2
    mycursor.execute("""
        SELECT 
            s.id AS song_id,
            s.title,
            s.artist,
            s.youtube_id,
            ps.position,
            ps.added_at
        FROM playlist_songs ps
        JOIN songs s ON ps.song_id = s.id
        WHERE ps.playlist_id = %s   -- replace ? with the playlist ID you want
        ORDER BY ps.position ASC;
    """, (playlist_id,))
    myresult = mycursor.fetchall()
    combined = ""
    for x in myresult:
      combined += x[3] + '\n'
    
    return combined

@app.route("/top_tracks", methods=['GET'])
def top_tracks():
    params = {
        "method": "chart.gettoptracks",
        "api_key": LAST_FM_API_KEY,
        "format": "json",
        "limit": 20
    }
    response = requests.get(LAST_FM_ROOT, params=params)
    return response.text

@app.route("/track_info/<mbid>", methods=['GET'])
def track_info(mbid):
    params = {
        "method": "track.getinfo",
        "api_key": LAST_FM_API_KEY,
        "format": "json",
        "mbid": mbid,
    }
    response = requests.get(LAST_FM_ROOT, params=params)
    return response.text


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=8000)
