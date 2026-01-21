const artists = ["Daft Punk", "Mk.Gee", "Tame Impala", "Omar Apollo", "Metallica"];
const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const BACKEND = "http://34.58.86.86:3000";

let list_of_songs = [`${BACKEND}/stream/hyperreal.wav`, `${BACKEND}/stream/Say.wav`, `${BACKEND}/stream/guitar.wav`, "https://streams.radiomast.io/ref-128k-mp3-stereo", `${BACKEND}/stream/Say.wav`];
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

function on_player_time_update() {
    if (pause_time_update || waiting_for_on_can_play) return;
    slider.value = (main_audio_player.currentTime / main_audio_player.duration) * 100.0;
    update_player_scrubber();
}
function on_player_can_play() {
    if(want_to_play) {
        play_music();
    }
    want_to_play = false;
    waiting_for_on_can_play = false;
    root.style.setProperty('--thumb-color', 'var(--hi-color)');
}
function on_playback_finished() {
    pause_music();
}

function on_scrubber_set() {
    update_player_scrubber();
}
function on_scrubber_mouse_up() {
    main_audio_player.currentTime = (slider.value / 100.0) * main_audio_player.duration;
    pause_time_update = false;
}
function on_scrubber_mouse_down() {
    pause_time_update = true;
}

function update_player_scrubber() {
    const sliderValue = slider.value;
    slider.style.background = `linear-gradient(to right, var(--li-color) ${sliderValue}%, var(--lifted-color) ${sliderValue}%)`;
}
function set_player_to_standby() {
    waiting_for_on_can_play = true;
    want_to_play = true;
    root.style.setProperty('--thumb-color', 'gray');
    slider.value = 0;
    update_player_scrubber();
    pause_music();
    document.getElementById("play_button_path").setAttribute("d", "M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 L 0 64 Z" );
}
function set_audio_source(url) {
    main_audio_player.src = url;
    main_audio_player.load();
}
function start_local_song() {
    set_player_to_standby();

    let url = list_of_songs[current_song];

    set_audio_source(url);
    update_media_player();
}
async function start_youtube_song(yt_song) {
    set_player_to_standby();

    try {
        let response = await fetch(`${BACKEND}/url/${yt_song.youtube_id}`);
        let data = await response.json();
        console.log(data);
    

        set_audio_source(data.url);
        update_media_player_new(yt_song);
    } catch (err) {
        console.log(err);
    }
}
function toggle_playback() {
    if (playing) {
        pause_music();
    } else {
        play_music();
    }
}
function play_music() {
    main_audio_player.play();
    document.getElementById("play_button_path").setAttribute("d", " M 31.667 30 L 56.667 30 L 56.667 99.5 L 31.667 99.5 L 31.667 30 L 31.667 30 Z  M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 L 0 64 Z  M 72.667 30 L 97.667 30 L 97.667 99.5 L 72.667 99.5 L 72.667 30 Z " );
    playing = true;
}
function pause_music() {
    main_audio_player.pause();
    document.getElementById("play_button_path").setAttribute("d", " M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 Z  M 107.074 64.589 L 73.037 84.24 L 39 103.891 L 39 64.589 L 39 25.287 L 73.037 44.938 L 107.074 64.589 Z " );
    playing = false;
}
function next_track() {
    current_song += 1;
    if (current_song >= list_of_songs.length) {
        current_song = 0;
    }
    start_local_song();
}
function previous_track() {
    current_song -= 1;
    if (current_song < 0) {
        current_song = list_of_songs.length - 1;
    }
    start_local_song();
}

function update_media_player() {
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
function update_media_player_new(info) {
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
function collection_list(parent, _label) {
    let label = document.createElement('div');
    label.className = "collection_list_label";
    label.textContent = _label;
    parent.appendChild(label);

    let _collection_list = document.createElement('div');
    _collection_list.className = "collection_list";
    parent.appendChild(_collection_list);

    return _collection_list;
}
function regenerate_album_page(album_element) {
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

    fetch_tracks(album_element.simple.spotify_id).then((tracks) => {
        let i = 0;
        for (const track of tracks.items) {
            document.getElementById("songlist").insertAdjacentHTML("beforeend", 
                `
                <div class="row" data-track="${i}">
                    ${i+1}
                    <div style="width: calc(4 * var(--s));"></div>
                    <div class="rowtext"><div class="title">${track.name}</div><div class="artist">${track.artists[0].name}</div></div>
                </div>
                `);
            i += 1;
        }
    });
}
function go_to_page(id) {
    for( const item of document.getElementsByClassName("pageview")) {
        item.style.display = "none";
    }
    document.getElementById(id).style.display = "block";
}

// APIs
async function acquire_spotify_access_token() {
    if (spotify_access_token != null) return;
    const response = await fetch(`${BACKEND}/token`);
    const data = await response.json();
    spotify_access_token = data.access_token;
}
function spotifetch(suburl) {
    return fetch(`https://api.spotify.com/v1/${suburl}`, {
        headers: {
            "Authorization": `Bearer ${spotify_access_token}`
        }
    });
}
async function fetch_albums(artist_id) {
    const response = await spotifetch(`artists/${artist_id}/albums`);
    return response.json();
}
async function fetch_tracks(spotify_id) {
    const response = await spotifetch(`albums/${spotify_id}/tracks`);
    return response.json();
}
async function search_artist(artistName) {
  const response = await spotifetch(`search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
  const data = await response.json();
  return data.artists.items[0];
}

async function save_song_to_playlist(text) {
    let response = await fetch(`${BACKEND}/save_song`, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: text,
    })
    let data = await response.json();
    if ("message" in data && data.message == "DUPLICATE" && "title" in data) {
        notify(`Already added ${data.title}`, "rgb(255, 180, 67)");
    }
}

async function find_youtube_id(artist, title) {
    // let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
    let response = await fetch(`${BACKEND}/search/${encodeURIComponent(`${artist} ${title} "topic"`)}`);
    let data = await response.json();
    const item = data.items[0];
    console.log(data.items[0]);
    return item.id.videoId;
}

async function gather_searched_songs(query) {
    // let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`);
    let response = await fetch(`${BACKEND}/search/${encodeURIComponent(query)}`);
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
                start_youtube_song(_this.simple);
            },
        });
    }
    return ret;
}
async function gather_saved_songs() {
    const response = await fetch(`${BACKEND}/saved_songs`);
    const data = await response.json();
    
    let ret = [];
    for (const song_info of data) {
        const id = song_info.youtube_id;
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
                start_youtube_song(_this.simple);
            },
        });
    }
    return ret;
}
async function gather_top_chart_songs() {
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
            on_click: cache_this_youtube_id,
        });
    }
    return ret;
}
async function cache_this_youtube_id(_this) {
    if (!('youtube_id' in _this.simple)) {
        console.log("fetching the YT video for _this track...");
        console.log(`${_this.simple.artist} ${_this.simple.title} "topic"`);
        _this.simple.youtube_id = await find_youtube_id(_this.simple.artist, _this.simple.title);
        console.log(`found: ${_this.simple.youtube_id}`);
        start_youtube_song(_this.simple);
        _this.removeEventListener('click', _this.simple.on_click);
        _this.addEventListener('click', function() {
            start_youtube_song(_this.simple);
        });
    }
}
function reifiy_music_item(parent, track) {
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
function reify_music_item(parent, arr) {
    for (track of arr) {
        reifiy_music_item(parent, track);
    }
}
async function populate_home_page() {
    let home_page_element = document.getElementById("home_page");

    let mine = collection_list(home_page_element, "Colsen");
    reifiy_music_item(mine, {
        title: "mine",
        artist: "Colsen",
        image: "images/red.jpg",
        on_click: function (_this) {
            regenerate_album_page(_this);
            go_to_page("album_page");
        },
        spotify_id: 0,
    });
    let saved_songs = collection_list(home_page_element, "Saved Songs");
    gather_saved_songs()
    .then(items => {
        reify_music_item(saved_songs, items);
    });

    let top_charts = collection_list(home_page_element, "Top Charts");
    gather_top_chart_songs()
    .then(items => {
        reify_music_item(top_charts, items);
    });

    await acquire_spotify_access_token();
    for (let i = 0; i < artists.length; i++) {
        let artist = await search_artist(artists[i]);
        let tracks = await fetch_albums(artist.id);
        let _collection_list = collection_list(home_page_element, artists[i]);
        let arr = [];
        for (const album of tracks.items) {
            arr.push({
                title: album.name,
                artist: album.artists[0].name,
                image: album.images[0].url,
                youtube_id: null,
                on_click: function(_this) {
                    regenerate_album_page(_this);
                    go_to_page("album_page");
                },
                spotify_id: album.id,
            });
        }
        reify_music_item(_collection_list, arr);
    }
}

function notify(text, color) {
    notif.textContent = text;
    notif.timer = 200;
    if (!color) {
        notif.style.color = "white";
    } else {
        notif.style.color = color;
    }
}
function notif_update() {
    notif.timer -= 1;
    let adjusted = Math.min(0, notif.timer);
    notif.style.right = `${adjusted}px`;
    requestAnimationFrame(notif_update);
}
requestAnimationFrame(notif_update);

// GUI
document.addEventListener("keydown", (event) => {
    if(event.key == ' ') {
        if (document.activeElement === document.getElementById("search_bar")) {} else {
            toggle_playback();
        }
    }
});
document.getElementById("play_button_square").addEventListener("click", toggle_playback);
document.getElementById("skip_back").addEventListener("click", previous_track);
document.getElementById("skip_forward").addEventListener("click", next_track);
const search_bar_element = document.getElementById("search_bar");

search_bar_element.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        gather_searched_songs(search_bar_element.value)
        .then(items => {
            reify_music_item(document.getElementById("search_page"), items);
        });
    }
});

document.addEventListener("click", event => {
    if (event.target.className == "options") {
        const c = event.target.closest(".collection_list_element_div");
        if (!("youtube_id" in c.simple)) {
            notify(`waiting for youtube id`);
            find_youtube_id(c.simple.artist, c.simple.title).then(id => {
                c.simple.youtube_id = id;
                save_song_to_playlist(`${c.simple.title}\n${c.simple.artist}\n${c.simple.youtube_id}`);
                notify(`Saved ${c.simple.title}`);
            });
            return;
        }
        if (c.simple.youtube_id == null) {
            notify(`Could not save playlist ${c.simple.title}`, "rgb(230, 58, 58)");
            return;
        }
        save_song_to_playlist(`${c.simple.title}\n${c.simple.artist}\n${c.simple.youtube_id}`);
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
    update_media_player();

    navigator.mediaSession.setActionHandler('play', function() { play_music(); });
    navigator.mediaSession.setActionHandler('pause', function() { pause_music(); });
    navigator.mediaSession.setActionHandler('previoustrack', function() { previous_track(); });
    navigator.mediaSession.setActionHandler('nexttrack', function() { next_track(); });
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
update_player_scrubber();
if (/Mobi|Android/i.test(navigator.userAgent)) {
    root.style.setProperty("--scale-factor", "1");
} else {
    root.style.setProperty("--scale-factor", "0.3");
}
populate_home_page();
go_to_page("home_page");


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