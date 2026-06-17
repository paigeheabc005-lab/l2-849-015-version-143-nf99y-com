(function () {
    window.initMoviePlayer = function (rootId, streamUrl) {
        var root = document.getElementById(rootId);
        if (!root) {
            return;
        }
        var video = root.querySelector("video");
        var overlay = root.querySelector("[data-player-overlay]");
        var loaded = false;
        var requestedPlay = false;
        var hlsInstance = null;

        function launch() {
            if (!video) {
                return;
            }
            root.classList.add("player-active");
            video.setAttribute("controls", "controls");
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    if (!requestedPlay) {
                        root.classList.remove("player-active");
                    }
                });
            }
        }

        function attachStream() {
            if (loaded || !video) {
                return;
            }
            loaded = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
                video.load();
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(streamUrl);
                hlsInstance.attachMedia(video);
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                    if (requestedPlay) {
                        launch();
                    }
                });
                root.hlsInstance = hlsInstance;
                return;
            }
            video.src = streamUrl;
            video.load();
        }

        function start(event) {
            if (event) {
                event.preventDefault();
            }
            requestedPlay = true;
            attachStream();
            launch();
        }

        if (overlay) {
            overlay.addEventListener("click", start);
        }

        video.addEventListener("click", function () {
            if (!loaded) {
                start();
            }
        });

        video.addEventListener("play", function () {
            root.classList.add("player-active");
        });

        video.addEventListener("error", function () {
            if (hlsInstance && typeof hlsInstance.destroy === "function") {
                hlsInstance.destroy();
            }
        });
    };
})();
