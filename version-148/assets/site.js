(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function pagePrefix() {
        var path = window.location.pathname;
        if (path.indexOf("/movies/") !== -1 || path.indexOf("/categories/") !== -1) {
            return "../";
        }
        return "./";
    }

    function initMobileMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("open");
        });
    }

    function initHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === current);
            });
        }

        function play() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                play();
            });
        });

        show(0);
        play();
    }

    function initGlobalSearch() {
        var data = window.MovieSearchIndex || [];
        var prefix = pagePrefix();
        var forms = Array.prototype.slice.call(document.querySelectorAll(".global-search"));
        if (!forms.length || !data.length) {
            return;
        }

        forms.forEach(function (form) {
            var input = form.querySelector("input[type='search']");
            var panel = form.querySelector(".search-panel");
            if (!input || !panel) {
                return;
            }

            function render(query) {
                var value = query.trim().toLowerCase();
                if (!value) {
                    panel.classList.remove("active");
                    panel.innerHTML = "";
                    return;
                }

                var results = data.filter(function (movie) {
                    var text = [movie.title, movie.year, movie.region, movie.genre, movie.tags, movie.category].join(" ").toLowerCase();
                    return text.indexOf(value) !== -1;
                }).slice(0, 9);

                panel.classList.add("active");
                if (!results.length) {
                    panel.innerHTML = '<div class="empty-result">没有找到匹配影片</div>';
                    return;
                }

                panel.innerHTML = results.map(function (movie) {
                    return '<a class="search-item" href="' + prefix + movie.url + '">' +
                        '<img src="' + prefix + movie.cover + '" alt="' + escapeHtml(movie.title) + '">' +
                        '<span>' + escapeHtml(movie.title) + '<small>' + escapeHtml(movie.year + ' · ' + movie.region + ' · ' + movie.category) + '</small></span>' +
                        '</a>';
                }).join("");
            }

            input.addEventListener("input", function () {
                render(input.value);
            });

            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var first = panel.querySelector("a");
                if (first) {
                    window.location.href = first.href;
                }
            });

            document.addEventListener("click", function (event) {
                if (!form.contains(event.target)) {
                    panel.classList.remove("active");
                }
            });
        });
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function initFilters() {
        var filterRoot = document.querySelector("[data-filter-root]");
        if (!filterRoot) {
            return;
        }
        var keyword = filterRoot.querySelector("[data-filter-keyword]");
        var year = filterRoot.querySelector("[data-filter-year]");
        var region = filterRoot.querySelector("[data-filter-region]");
        var tags = Array.prototype.slice.call(filterRoot.querySelectorAll("[data-filter-tag]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
        var activeTag = "";

        function valueOf(element) {
            return element ? element.value.trim().toLowerCase() : "";
        }

        function apply() {
            var key = valueOf(keyword);
            var selectedYear = valueOf(year);
            var selectedRegion = valueOf(region);
            cards.forEach(function (card) {
                var text = [card.dataset.title, card.dataset.year, card.dataset.region, card.dataset.genre, card.dataset.tags].join(" ").toLowerCase();
                var ok = true;
                if (key && text.indexOf(key) === -1) {
                    ok = false;
                }
                if (selectedYear && String(card.dataset.year).toLowerCase() !== selectedYear) {
                    ok = false;
                }
                if (selectedRegion && String(card.dataset.region).toLowerCase() !== selectedRegion) {
                    ok = false;
                }
                if (activeTag && text.indexOf(activeTag) === -1) {
                    ok = false;
                }
                card.hidden = !ok;
            });
        }

        [keyword, year, region].forEach(function (element) {
            if (element) {
                element.addEventListener("input", apply);
                element.addEventListener("change", apply);
            }
        });

        tags.forEach(function (tag) {
            tag.addEventListener("click", function () {
                var value = tag.getAttribute("data-filter-tag").toLowerCase();
                activeTag = activeTag === value ? "" : value;
                tags.forEach(function (item) {
                    item.classList.toggle("active", item === tag && activeTag);
                });
                apply();
            });
        });
    }

    ready(function () {
        initMobileMenu();
        initHero();
        initGlobalSearch();
        initFilters();
    });
})();
