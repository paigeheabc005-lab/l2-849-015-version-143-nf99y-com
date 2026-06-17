(function () {
    "use strict";

    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function escapeHTML(value) {
        return String(value || "").replace(/[&<>"]/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;"
            }[char];
        });
    }

    function attachMobileMenu() {
        var toggle = qs(".menu-toggle");
        var panel = qs(".mobile-panel");

        if (!toggle || !panel) {
            return;
        }

        toggle.addEventListener("click", function () {
            var isOpen = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!isOpen));
            panel.hidden = isOpen;
        });
    }

    function attachImageFallbacks(root) {
        qsa("[data-cover-image]", root).forEach(function (img) {
            img.addEventListener("error", function () {
                var box = img.closest(".movie-card__cover, .compact-card__cover, .category-card__covers, .hero-cover");
                if (box) {
                    box.classList.add("is-missing");
                }
            }, { once: true });
        });
    }

    function attachHero() {
        var dataNode = qs("#hero-data");
        if (!dataNode) {
            return;
        }

        var items;
        try {
            items = JSON.parse(dataNode.textContent || "[]");
        } catch (error) {
            items = [];
        }

        if (!items.length) {
            return;
        }

        var title = qs("[data-hero-title]");
        var desc = qs("[data-hero-desc]");
        var year = qs("[data-hero-year]");
        var region = qs("[data-hero-region]");
        var category = qs("[data-hero-category]");
        var link = qs("[data-hero-link]");
        var covers = qsa("[data-hero-cover]");
        var index = 0;

        function updateHero() {
            var item = items[index % items.length];

            if (title) title.textContent = item.title || "";
            if (desc) desc.textContent = item.oneLine || "";
            if (year) year.textContent = item.year || "";
            if (region) region.textContent = item.region || "";
            if (category) category.textContent = item.category || "";
            if (link) link.href = item.url || "#";

            covers.forEach(function (cover, coverIndex) {
                var coverItem = items[(index + coverIndex) % items.length];
                var img = qs("img", cover);
                var label = qs("span", cover);

                cover.href = coverItem.url || "#";
                if (img) {
                    img.src = coverItem.cover || "";
                    img.alt = coverItem.title || "";
                }
                if (label) {
                    label.textContent = coverItem.title || "";
                }
            });
        }

        updateHero();
        window.setInterval(function () {
            index = (index + 1) % items.length;
            updateHero();
        }, 6200);
    }

    function attachLocalFilter() {
        var input = qs("[data-local-search]");
        var grid = qs("[data-local-filter-grid]");

        if (!input || !grid) {
            return;
        }

        var cards = qsa(".movie-card", grid);
        input.addEventListener("input", function () {
            var query = input.value.trim().toLowerCase();

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-type")
                ].join(" ").toLowerCase();
                card.hidden = query && haystack.indexOf(query) === -1;
            });
        });
    }

    function getSearchParams() {
        var params = new URLSearchParams(window.location.search);
        return {
            q: params.get("q") || "",
            category: params.get("category") || "",
            type: params.get("type") || "",
            year: params.get("year") || ""
        };
    }

    function createSearchCard(item) {
        var tagList = (item.tags || []).slice(0, 3).map(function (tag) {
            return "<span>" + escapeHTML(tag) + "</span>";
        }).join("");

        return [
            "<article class=\"movie-card\" data-title=\"" + escapeHTML(item.title) + "\">",
            "    <a href=\"" + escapeHTML(item.url) + "\" class=\"movie-card__link\" aria-label=\"观看 " + escapeHTML(item.title) + "\">",
            "        <div class=\"movie-card__cover\">",
            "            <img src=\"" + escapeHTML(item.cover) + "\" alt=\"" + escapeHTML(item.title) + "\" loading=\"lazy\" data-cover-image>",
            "            <span class=\"movie-card__fallback\">" + escapeHTML(item.title) + "</span>",
            "            <span class=\"movie-card__badge movie-card__badge--type\">" + escapeHTML(item.type) + "</span>",
            "            <span class=\"movie-card__badge movie-card__badge--region\">" + escapeHTML(item.category) + "</span>",
            "            <span class=\"movie-card__play\">▶</span>",
            "        </div>",
            "        <div class=\"movie-card__body\">",
            "            <h3>" + escapeHTML(item.title) + "</h3>",
            "            <p>" + escapeHTML(item.oneLine) + "</p>",
            "            <div class=\"movie-card__meta\"><span>" + escapeHTML(item.year) + "</span><span>" + escapeHTML(item.region) + "</span></div>",
            "            <div class=\"movie-card__tags\">" + tagList + "</div>",
            "        </div>",
            "    </a>",
            "</article>"
        ].join("\n");
    }

    function attachSearchPage() {
        var form = qs("[data-search-form]");
        var input = qs("[data-search-input]");
        var category = qs("[data-search-category]");
        var type = qs("[data-search-type]");
        var year = qs("[data-search-year]");
        var summary = qs("[data-search-summary]");
        var results = qs("[data-search-results]");
        var index = window.MOVIE_SEARCH_INDEX || [];

        if (!form || !input || !results || !index.length) {
            return;
        }

        var initialParams = getSearchParams();
        input.value = initialParams.q;
        if (category) category.value = initialParams.category;
        if (type) type.value = initialParams.type;
        if (year) year.value = initialParams.year;

        function runSearch() {
            var q = input.value.trim().toLowerCase();
            var selectedCategory = category ? category.value : "";
            var selectedType = type ? type.value : "";
            var selectedYear = year ? year.value : "";

            var filtered = index.filter(function (item) {
                var haystack = [
                    item.title,
                    item.region,
                    item.type,
                    item.category,
                    item.year,
                    (item.tags || []).join(" "),
                    item.oneLine
                ].join(" ").toLowerCase();

                if (q && haystack.indexOf(q) === -1) return false;
                if (selectedCategory && item.category !== selectedCategory) return false;
                if (selectedType && item.type !== selectedType) return false;
                if (selectedYear && item.year !== selectedYear) return false;
                return true;
            }).slice(0, 120);

            if (summary) {
                summary.textContent = filtered.length ? "已显示匹配结果，点击卡片可进入详情播放。" : "没有找到匹配内容，请更换关键词或筛选条件。";
            }

            results.innerHTML = filtered.map(createSearchCard).join("\n");
            attachImageFallbacks(results);
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            runSearch();
        });

        [input, category, type, year].forEach(function (control) {
            if (control) {
                control.addEventListener("input", runSearch);
                control.addEventListener("change", runSearch);
            }
        });

        if (initialParams.q || initialParams.category || initialParams.type || initialParams.year) {
            runSearch();
        }
    }

    function attachPlayers() {
        qsa("video[data-hls]").forEach(function (video) {
            var frame = video.closest(".player-frame");
            var overlay = frame ? qs(".player-overlay", frame) : null;
            var status = frame ? qs("[data-player-status]", frame) : null;
            var hlsInstance = null;

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function loadSource() {
                if (video.dataset.loaded === "true") {
                    return;
                }

                var source = video.getAttribute("data-hls");
                if (!source) {
                    setStatus("播放源暂不可用");
                    return;
                }

                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    setStatus("正在使用浏览器原生 HLS 播放");
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus("播放源加载完成");
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            setStatus("网络波动，正在重新加载播放源");
                            hlsInstance.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            setStatus("媒体解码异常，正在恢复播放");
                            hlsInstance.recoverMediaError();
                        } else {
                            setStatus("播放源加载失败，请刷新页面重试");
                            hlsInstance.destroy();
                        }
                    });
                    setStatus("正在初始化 HLS 播放源");
                } else {
                    video.src = source;
                    setStatus("当前浏览器将尝试直接播放 m3u8 源");
                }

                video.dataset.loaded = "true";
            }

            function startPlayback() {
                loadSource();
                if (overlay) {
                    overlay.hidden = true;
                }
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {
                        setStatus("请再次点击视频播放按钮开始播放");
                    });
                }
            }

            if (overlay) {
                overlay.addEventListener("click", startPlayback);
            }

            video.addEventListener("click", loadSource, { once: true });
            video.addEventListener("play", function () {
                loadSource();
                if (overlay) {
                    overlay.hidden = true;
                }
            });
            window.addEventListener("pagehide", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        attachMobileMenu();
        attachImageFallbacks(document);
        attachHero();
        attachLocalFilter();
        attachSearchPage();
        attachPlayers();
    });
})();
