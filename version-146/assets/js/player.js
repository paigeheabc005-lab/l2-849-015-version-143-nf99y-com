function initMoviePlayer(source) {
    var video = document.getElementById('movieVideo');
    var button = document.getElementById('moviePlayButton');
    var prepared = false;
    var hls = null;

    if (!video || !button || !source) {
        return;
    }

    function prepare() {
        if (prepared) {
            return;
        }

        prepared = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            return;
        }

        video.src = source;
    }

    function playMovie() {
        prepare();
        button.classList.add('is-hidden');
        var promise = video.play();

        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
                button.classList.remove('is-hidden');
            });
        }
    }

    button.addEventListener('click', playMovie);

    video.addEventListener('click', function () {
        if (video.paused) {
            playMovie();
        }
    });

    Array.prototype.slice.call(document.querySelectorAll('[data-play-trigger]')).forEach(function (trigger) {
        trigger.addEventListener('click', function (event) {
            event.preventDefault();
            playMovie();
        });
    });

    prepare();

    video.addEventListener('play', function () {
        button.classList.add('is-hidden');
    });

    video.addEventListener('pause', function () {
        if (!video.ended) {
            button.classList.remove('is-hidden');
        }
    });

    window.addEventListener('beforeunload', function () {
        if (hls) {
            hls.destroy();
        }
    });
}
