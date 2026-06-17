(function () {
    function playElement(video) {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
        }
    }

    function initMoviePlayer(options) {
        var video = document.getElementById(options.videoId);
        var button = document.querySelector(options.buttonSelector);
        var source = options.source;
        var loaded = false;
        var hlsInstance = null;

        if (!video || !source) {
            return;
        }

        function hideButton() {
            if (button) {
                button.classList.add('is-hidden');
            }
        }

        function attachSource(autoplay) {
            if (loaded) {
                if (autoplay) {
                    playElement(video);
                }
                return;
            }

            loaded = true;

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                if (autoplay) {
                    playElement(video);
                }
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                if (autoplay) {
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        playElement(video);
                    });
                }
                return;
            }

            video.src = source;
            if (autoplay) {
                playElement(video);
            }
        }

        function startPlayback() {
            hideButton();
            attachSource(true);
        }

        if (button) {
            button.addEventListener('click', startPlayback);
        }

        video.addEventListener('click', function () {
            if (video.paused) {
                startPlayback();
            } else {
                video.pause();
            }
        });

        video.addEventListener('play', hideButton);
        video.addEventListener('loadedmetadata', function () {
            if (button && !video.paused) {
                hideButton();
            }
        });

        window.addEventListener('pagehide', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
        });
    }

    window.initMoviePlayer = initMoviePlayer;
})();
