let list_of_songs = [ "audio/hyperreal.wav", "audio/Say.wav" ];
let song_titles = ["New Planet", "Say"]
let song_artists = ["Colsen", "Colsen"]
let song_covers = ["images/red.jpg","images/basement.jpg"]
let current_song = 0;
let playing = false; 
let id;
let r = document.querySelector(':root'); // r.style.setProperty('--blue', 'lightblue');
let slider = document.getElementById("pro_bar");
let data_not_loaded = false;

document.getElementById("main_audio_player").src = list_of_songs[0];

function TimeUpdate()
{
    if (!data_not_loaded) {
        slider.value = (document.getElementById("main_audio_player").currentTime / document.getElementById("main_audio_player").duration) * 100.0;
    }
    else {
        slider.value = 0.0;
    }
    PaintSliderTrack();
}
function MetaDataLoaded() {
    data_not_loaded = false;
    TimeUpdate();
}
function BarInput() {
    document.getElementById("main_audio_player").currentTime = (slider.value / 100.0) * document.getElementById("main_audio_player").duration;
    TimeUpdate();
}
function PaintSliderTrack() {
    const sliderValue = slider.value;
    slider.style.background = `linear-gradient(to right, #ccc ${sliderValue}%, #333 ${sliderValue}%)`;
}
function MusicEnded() {
    PauseMusic();
}

function PlayCurrentSong() {
    document.getElementById("main_audio_player").src = list_of_songs[current_song];
    document.getElementById("main_audio_player").currentTime = 0;

    data_not_loaded = true;

    PlayMusic();
    UpdateMediaPlayer();
}

function PlayMusic()
{
    document.getElementById("main_audio_player").play();
    document.getElementById("play_button_path").setAttribute("d", " M 31.667 30 L 56.667 30 L 56.667 99.5 L 31.667 99.5 L 31.667 30 L 31.667 30 Z  M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 L 0 64 Z  M 72.667 30 L 97.667 30 L 97.667 99.5 L 72.667 99.5 L 72.667 30 Z " );
    playing = true;
}
function PauseMusic() {
    document.getElementById("main_audio_player").pause();
    document.getElementById("play_button_path").setAttribute("d", " M 0 64 C 0 28.677 28.677 0 64 0 C 99.323 0 128 28.677 128 64 C 128 99.323 99.323 128 64 128 C 28.677 128 0 99.323 0 64 Z  M 107.074 64.589 L 73.037 84.24 L 39 103.891 L 39 64.589 L 39 25.287 L 73.037 44.938 L 107.074 64.589 Z " );
    playing = false;
}
function NextSong()
{
    current_song += 1;
    if (current_song >= list_of_songs.length) {
        current_song = 0;
    }
    
    PlayCurrentSong();
}
function PreviousSong()
{
    current_song -= 1;
    if (current_song < 0) {
        current_song = list_of_songs.length - 1;
    }
    
    PlayCurrentSong();
}

// GUI
document.getElementById("play_button_square").addEventListener("click", function() {
    if (playing) {
        PauseMusic();
    } else {
        PlayMusic();
    }
});
document.getElementById("skip_back").addEventListener("click", PreviousSong);
document.getElementById("skip_forward").addEventListener("click", NextSong);
document.addEventListener("resize", (event) => {});
document.addEventListener("keydown", (event) => {
    if(event.key == ' ') {
        if (playing) {
            PauseMusic();
        } else {
            PlayMusic();
        } 
    }
});

function UpdateMediaPlayer() {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: song_titles[current_song],
        artist: song_artists[current_song],
        album: 'Nectar',
        artwork: [
            { src: song_covers[current_song], sizes: '474x474', type: 'image/jpg' }, // can include smaller sized versions of the image
        ]
    });
    document.getElementById("cover").src = song_covers[current_song];
}

for (let i = 0; i < song_covers.length; i++){
    document.getElementById("songlist").innerHTML += `<div class="row" role="button" data-track="`+i+`">
          <img src="`+song_covers[i]+`" class="thumbnail"></img>
          <div class="rowtext"><div class="title">`+song_titles[i]+`</div><div class="artist">`+song_artists[i]+`</div></div>
        </div>`
}
let rows = document.getElementsByClassName("row");
for(let i = 0; i < rows.length; i++) {
    rows[i].addEventListener("click", function() {
        current_song = Number(rows[i].dataset.track);
        PlayCurrentSong();
    });
}

if ('mediaSession' in navigator) {
    UpdateMediaPlayer();

    navigator.mediaSession.setActionHandler('play', function() { PlayMusic(); });
    navigator.mediaSession.setActionHandler('pause', function() { PauseMusic(); });
    navigator.mediaSession.setActionHandler('previoustrack', function() { PreviousSong(); });
    navigator.mediaSession.setActionHandler('nexttrack', function() { NextSong(); });
    navigator.mediaSession.setActionHandler('seekto', function(details) {
        document.getElementById("main_audio_player").currentTime = details.seekTime;
        navigator.mediaSession.setPositionState({
            duration: document.getElementById("main_audio_player").duration,
            playbackRate: document.getElementById("main_audio_player").playbackRate,
            position: document.getElementById("main_audio_player").currentTime
        });
    });
}
