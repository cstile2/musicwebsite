const artists = ["Daft Punk", "Mk.Gee", "Tame Impala", "Omar Apollo", "Metallica"];
const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const BACKEND = "http://127.0.0.1:3000";

let list_of_songs = ["audio/hyperreal.wav", "audio/Say.wav", "audio/guitar.wav", "https://streams.radiomast.io/ref-128k-mp3-stereo", `${BACKEND}/audio_stream/Say.wav`];
let song_titles = ["New Planet", "Say", "Guitar Sound", "Radio", "Streamed"];
let song_artists = ["Colsen", "Colsen", "IDK", "Radio Mast", "ME"];
let song_images = ["images/red.jpg", "images/basement.jpg", "images/nectar.jpg", "images/meeky.jpg", "images/meeky.jpg"];
let current_song = 0;
let playing = false;
let root = document.querySelector(':root');
let slider = document.getElementById("pro_bar");
let main_audio_player = document.getElementById("main_audio_player");
let want_to_play = false;
let pause_time_update = false;
let waiting_for_on_can_play = false;
let spotify_access_token = null;
let notif = document.getElementById("notif");
notif.timer = 0;

main_audio_player.src = list_of_songs[0];

function OnTimeUpdate() {
    if (pause_time_update || waiting_for_on_can_play) return;
    slider.value = (main_audio_player.currentTime / main_audio_player.duration) * 100.0;
    PaintSliderTrack();
}
function OnCanPlay() {
    if(want_to_play) {
        PlayMusic();
    }
    want_to_play = false;
    waiting_for_on_can_play = false;
    root.style.setProperty('--thumb-color', 'var(--hi-color)');
}
function OnMusicEnded() {
    PauseMusic();
}

function BarInput() {
    PaintSliderTrack();
}
function BarOnMouseUp() {
    main_audio_player.currentTime = (slider.value / 100.0) * main_audio_player.duration;
    pause_time_update = false;
}
function BarOnMouseDown() {
    pause_time_update = true;
}

function PaintSliderTrack() {
    const sliderValue = slider.value;
    slider.style.background = `linear-gradient(to right, var(--li-color) ${sliderValue}%, var(--lifted-color) ${sliderValue}%)`;
}
function SetPlayerToStandBy() {
    waiting_for_on_can_play = true;
    want_to_play = true;
    root.style.setProperty('--thumb-color', 'gray');
    slider.value = 0;
    PaintSliderTrack();
    PauseMusic();
    document.getElementById("play_button_path").setAttribute("d", "M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 L 0 64 Z" );
}
function SetAudioSrc(url) {
    main_audio_player.src = url;
    main_audio_player.load();
}
function StartLocalSong() {
    SetPlayerToStandBy();

    let url = list_of_songs[current_song];

    SetAudioSrc(url);
    UpdateMediaPlayer();
}
async function StartYoutubeSong(yt_song) {
    SetPlayerToStandBy();

    let response = await fetch(`${BACKEND}/url/${yt_song.youtube_id}`);
    let url = await response.text();

    SetAudioSrc(url);
    UpdateMediaPlayerNew(yt_song);
}
function PlayMusic() {
    main_audio_player.play();
    document.getElementById("play_button_path").setAttribute("d", " M 31.667 30 L 56.667 30 L 56.667 99.5 L 31.667 99.5 L 31.667 30 L 31.667 30 Z  M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 L 0 64 Z  M 72.667 30 L 97.667 30 L 97.667 99.5 L 72.667 99.5 L 72.667 30 Z " );
    playing = true;
}
function PauseMusic() {
    main_audio_player.pause();
    document.getElementById("play_button_path").setAttribute("d", " M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 Z  M 107.074 64.589 L 73.037 84.24 L 39 103.891 L 39 64.589 L 39 25.287 L 73.037 44.938 L 107.074 64.589 Z " );
    playing = false;
}
function NextSong() {
    current_song += 1;
    if (current_song >= list_of_songs.length) {
        current_song = 0;
    }
    StartLocalSong();
}
function PreviousSong() {
    current_song -= 1;
    if (current_song < 0) {
        current_song = list_of_songs.length - 1;
    }
    StartLocalSong();
}
function PlayPause() {
    if (playing) {
        PauseMusic();
    } else {
        PlayMusic();
    }
}
function UpdateMediaPlayer() {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: song_titles[current_song],
        artist: song_artists[current_song],
        album: 'Nectar',
        artwork: [
            { src: song_images[current_song], sizes: '474x474', type: 'image/jpg' }, // can include smaller sized versions of the image
        ]
    });
    document.getElementById("cover").src = song_images[current_song];
}

function UpdateMediaPlayerNew(info) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: info.title,
        artist: info.artist,
        album: 'Nectar',
        artwork: [
            { src: info.image, sizes: '474x474', type: 'image/jpg' }, // can include smaller sized versions of the image
        ]
    });
    document.getElementById("cover").src = info.image;
}

// DOM
function CollectionList(parent, _label) {
    let label = document.createElement('div');
    label.className = "collection_list_label";
    label.textContent = _label;
    parent.appendChild(label);

    let collection_list = document.createElement('div');
    collection_list.className = "collection_list";
    parent.appendChild(collection_list);

    return collection_list;
}
function RegenerateAlbumPage(album_element) {
    let page = document.getElementById("album_page");

    page.replaceChildren();
    page.insertAdjacentHTML("beforeend",
        `
        <div class="album_header">
            <img src="`+album_element.simple.image+`" class="album_header_cover" />
            <div class="album_header_right">
            <div class="album_name">${album_element.simple.title}</div>
                ${album_element.simple.artist}
            </div>
        </div>
        <div id="songlist"></div>
        `);
    
    if (album_element.simple.spotify_id == 0) {
        for (let i = 0; i < list_of_songs.length; i++) {
            document.getElementById("songlist").insertAdjacentHTML("beforeend", 
                `
                <div class="row" data-track="${i}">
                    ${i+1}
                    <div style="width: calc(4 * var(--s));"></div>
                    <div class="rowtext"><div class="title">${song_titles[i]}</div><div class="artist">${song_artists[i]}</div></div>
                </div>
                `);
        }
        return;
    }

    FetchTracks(album_element.simple.spotify_id).then((tracks) => {
        let i = 0;
        for (const track of tracks.items) {
            document.getElementById("songlist").insertAdjacentHTML("beforeend", 
                `
                <div class="row" data-track="${i}">
                    ${i+1}
                    <div style="width: calc(4 * var(--s));"></div>
                    <div class="rowtext"><div class="title">${track.name}</div><div class="artist">${album_element.dataset.artist}</div></div>
                </div>
                `);
            i += 1;
        }
    });
}
function GoToPage(id) {
    for( const item of document.getElementsByClassName("pageview")) {
        item.style.display = "none";
    }
    document.getElementById(id).style.display = "block";
}

// APIs
function SpotiFetch(suburl) {
    return fetch(`https://api.spotify.com/v1/${suburl}`, {
        headers: {
            "Authorization": `Bearer ${spotify_access_token}`
        }
    });
}
async function FetchAlbums(artist_id) {
    const response = await SpotiFetch(`artists/${artist_id}/albums`);
    return response.json();
}
async function FetchTracks(spotify_id) {
    const response = await SpotiFetch(`albums/${spotify_id}/tracks`);
    return response.json();
}
async function AcquireSpotifyToken() {
    if (spotify_access_token != null) return;
    const response = await fetch(`${BACKEND}/token`);
    const data = await response.json();
    spotify_access_token = data.access_token;
}
async function SearchArtist(artistName) {
  const response = await SpotiFetch(`search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
  const data = await response.json();
  return data.artists.items[0];
}
async function SaveSongToSavedSongs(text) {
    let response = await fetch(`${BACKEND}/save_song`, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: text,
    })
}

async function GetYouTubeVideoId(query) {
    let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
    let data = await response.json();
    const item = data.items[0];
    console.log(data.items[0]);
    return item.id.videoId;
}

async function GatherSearchItems(query) {
    let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
    let data = await response.json();
    const videos_only = data.items.filter(item => item.id.videoId);
    
    let ret = [];
    for (item of videos_only) {
        ret.push({
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            image: item.snippet.thumbnails.default.url,
            youtube_id: item.id.videoId,
            on_click: function(_this) {
                StartYoutubeSong(_this.simple);
            },
        });
    }
    return ret;
}
async function GatherSavedByYTID() {
    const response = await fetch(`${BACKEND}/saved_songs`);
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    
    let ret = [];
    for (const id of lines) {
        if (id == "") {
            // notify("saved song data contains invalid formatting");
            continue;
        }
        const _response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
        const _data = await _response.json();
        ret.push({
            title: _data.title,
            artist: _data.author_name,
            image: _data.thumbnail_url,
            youtube_id: id,
            thumbnail_zoom: null,
            on_click: function(_this) {
                StartYoutubeSong(_this.simple);
            },
        });
    }
    return ret;
}
async function GatherTopChartItems() {
    const response = await fetch(`${BACKEND}/top_tracks`);
    const data = await response.json();
    
    let ret = [];
    for (const track of data.tracks.track) {
        if (!("mbid" in track)) continue;
        const info_response = await fetch(`${BACKEND}/track_info/${track.mbid}`);
        const info_data = await info_response.json();
        if (!("track" in info_data)) {
            console.log("last_fm fetch gave an invalid item");
            continue;
        }
        let image = track.image[1]["#text"];
        if ("album" in info_data.track) image = info_data.track.album.image[2]["#text"];
        ret.push({
            title: track.name,
            artist: track.artist.name,
            image: image,
            on_click: CacheThisYoutubeID,
        });
    }
    return ret;
}
async function CacheThisYoutubeID(_this) {
    if (!('youtube_id' in _this.simple)) {
        console.log("fetching the YT video for _this track...");
        console.log(`${_this.simple.artist} ${_this.simple.title} "topic"`);
        _this.simple.youtube_id = await GetYouTubeVideoId(`${_this.simple.artist} ${_this.simple.title} "topic"`);
        console.log(`found: ${_this.simple.youtube_id}`);
        StartYoutubeSong(_this.simple);
        _this.removeEventListener('click', _this.simple.on_click);
        _this.addEventListener('click', function() {
            StartYoutubeSong(_this.simple);
        });
    }
}
function InstantiateMusicItem(parent, track) {
    let classes = "collection_list_element_img";
    if ("thumbnail_zoom" in track) {
        classes += " thumbnail_zoom";
    }
    parent.insertAdjacentHTML("beforeend",
        `
            <div class="collection_list_element_div">
                <img src="${track.image}" class="${classes}" draggable=false>
                <div class="collection_list_element_title">${track.title}</div>
                <div class="collection_list_element_label">${track.artist}</div>
                <div class="options">+</div>
            </div>
        `
    );
    parent.lastElementChild.simple = track;
}
function InstantiateMusicItems(parent, arr) {
    for (track of arr) {
        InstantiateMusicItem(parent, track);
    }
}
async function PopulateHomePage() {
    let home_page_element = document.getElementById("home_page");

    let mine = CollectionList(home_page_element, "Colsen");
    InstantiateMusicItem(mine, {
        title: "mine",
        artist: "Colsen",
        image: "images/red.jpg",
        on_click: function (_this) {
            RegenerateAlbumPage(_this);
            GoToPage("album_page");
        },
        spotify_id: 0,
    });
    let saved_songs = CollectionList(home_page_element, "Saved Songs");
    GatherSavedByYTID()
    .then(items => {
        InstantiateMusicItems(saved_songs, items);
    });

    let top_charts = CollectionList(home_page_element, "Top Charts");
    GatherTopChartItems()
    .then(items => {
        InstantiateMusicItems(top_charts, items);
    });

    await AcquireSpotifyToken();
    for (let i = 0; i < artists.length; i++) {
        let artist = await SearchArtist(artists[i]);
        let tracks = await FetchAlbums(artist.id);
        let collection_list = CollectionList(home_page_element, artists[i]);
        let arr = [];
        for (const album of tracks.items) {
            arr.push({
                title: album.name,
                artist: album.artists[0].name,
                image: album.images[0].url,
                youtube_id: null,
                on_click: function(_this) {
                    RegenerateAlbumPage(_this);
                    GoToPage("album_page");
                },
                spotify_id: album.id,
            });
        }
        InstantiateMusicItems(collection_list, arr);
    }
}

function notify(text) {
    notif.textContent = text;
    notif.timer = 200;
}
function notif_update() {
    notif.timer -= 1;
    let adjusted = Math.min(0, notif.timer);
    let col = notif.timer * 2;
    notif.style.right = `${adjusted}px`;
    notif.style.color = `rgb(${col},${col},${col})`;
    requestAnimationFrame(notif_update);
}
requestAnimationFrame(notif_update);

// GUI
document.addEventListener("keydown", (event) => {
    if(event.key == ' ') {
        if (document.activeElement === document.getElementById("search_bar")) {} else {
            PlayPause();
        }
    }
});
document.getElementById("play_button_square").addEventListener("click", PlayPause);
document.getElementById("skip_back").addEventListener("click", PreviousSong);
document.getElementById("skip_forward").addEventListener("click", NextSong);
const search_bar_element = document.getElementById("search_bar");

search_bar_element.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        GatherSearchItems(search_bar_element.value)
        .then(items => {
            InstantiateMusicItems(document.getElementById("search_page"), items);
        });
    }
});

document.addEventListener("click", event => {
    if (event.target.className == "options") {
        const c = event.target.closest(".collection_list_element_div");
        if (!("youtube_id" in c.simple)) {
            notify(`waiting for youtube id`);
            GetYouTubeVideoId(`${c.simple.artist} ${c.simple.title} "topic"`).then(id => {
                c.simple.youtube_id = id;
                SaveSongToSavedSongs(`${c.simple.title}\n${c.simple.artist}\n${c.simple.youtube_id}`);
                notify(`Saved ${c.simple.title}`);
            });
            return;
        }
        if (c.simple.youtube_id == null) {
            notify(`Could not save ${c.simple.title}`);
            return;
        }
        SaveSongToSavedSongs(`${c.simple.title}\n${c.simple.artist}\n${c.simple.youtube_id}`);
        notify(`Saved ${c.simple.title}`);
        return;
    }

    const c = event.target.closest(".collection_list_element_div");
    if (c != null) {
        c.simple.on_click(c);
    }
});

// Create Cross Platform Media Session
if ('mediaSession' in navigator) {
    UpdateMediaPlayer();

    navigator.mediaSession.setActionHandler('play', function() { PlayMusic(); });
    navigator.mediaSession.setActionHandler('pause', function() { PauseMusic(); });
    navigator.mediaSession.setActionHandler('previoustrack', function() { PreviousSong(); });
    navigator.mediaSession.setActionHandler('nexttrack', function() { NextSong(); });
    navigator.mediaSession.setActionHandler('seekto', function(details) {
        main_audio_player.currentTime = details.seekTime;
        navigator.mediaSession.setPositionState({
            duration: main_audio_player.duration,
            playbackRate: main_audio_player.playbackRate,
            position: main_audio_player.currentTime
        });
    });
}

notif.timer = -100;
slider.value = 0;
PaintSliderTrack();
if (/Mobi|Android/i.test(navigator.userAgent)) {
    root.style.setProperty("--scale-factor", "1");
} else {
    root.style.setProperty("--scale-factor", "0.3");
}
PopulateHomePage();
GoToPage("home_page");


// // ====================================== try this to play audio in background from the
// const video = document.getElementById('myVideo');

// // Create a new audio context
// const AudioContext = window.AudioContext || window.webkitAudioContext;
// const audioCtx = new AudioContext();

// // Create a MediaElementSource from the video
// const source = audioCtx.createMediaElementSource(video);

// // Connect it to the destination (the speakers)
// source.connect(audioCtx.destination);

// // iOS requires a user gesture to start audio
// document.body.addEventListener('click', () => {
//     // Resume audio context (required for iOS)
//     audioCtx.resume().then(() => {
//         video.play(); // start video playback (audio will play)
//     });
// }, { once: true });
// // ====================================== try this to play audio in background from the