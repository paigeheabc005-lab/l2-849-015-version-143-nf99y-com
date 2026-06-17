(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-nav]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        restart();
      });
    });
    if (slides.length > 1) {
      restart();
    }
  }

  function initFilters() {
    var areas = document.querySelectorAll("[data-filter-area]");
    areas.forEach(function (area) {
      var search = area.querySelector("[data-filter-search]");
      var fields = Array.prototype.slice.call(area.querySelectorAll("[data-filter-field]"));
      var list = document.querySelector("[data-filter-list]");
      var empty = area.querySelector(".filter-empty");
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));

      function apply() {
        var query = search ? search.value.trim().toLowerCase() : "";
        var matched = 0;
        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-category")
          ].join(" ").toLowerCase();
          var visible = !query || text.indexOf(query) !== -1;
          fields.forEach(function (field) {
            var value = field.value;
            var key = field.getAttribute("data-filter-field");
            if (value && key && text.indexOf(value.toLowerCase()) === -1) {
              visible = false;
            }
          });
          card.hidden = !visible;
          if (visible) {
            matched += 1;
          }
        });
        if (empty) {
          empty.hidden = matched !== 0;
        }
      }

      if (search) {
        search.addEventListener("input", apply);
      }
      fields.forEach(function (field) {
        field.addEventListener("change", apply);
      });
      apply();
    });
  }

  function renderSearchCard(movie) {
    return [
      '<article class="movie-card">',
      '  <a href="' + escapeHtml(movie.url) + '">',
      '    <div class="poster">',
      '      <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '      <div class="poster-gradient"></div>',
      '      <span class="poster-tag">' + escapeHtml(movie.type) + '</span>',
      '      <span class="poster-score">★ ' + escapeHtml(movie.score) + '</span>',
      '    </div>',
      '    <div class="card-body">',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine) + '</p>',
      '      <div class="card-meta">',
      '        <span>' + escapeHtml(movie.year) + '</span>',
      '        <span>' + escapeHtml(movie.region) + '</span>',
      '      </div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join("");
  }

  function initSearchPage() {
    var results = document.getElementById("search-results");
    if (!results || !window.searchIndex) {
      return;
    }
    var form = document.querySelector("[data-page-search-form]");
    var input = document.querySelector("[data-page-search-input]");
    var year = document.querySelector("[data-page-year]");
    var region = document.querySelector("[data-page-region]");
    var empty = document.querySelector("[data-search-empty]");
    var params = new URLSearchParams(window.location.search);
    if (input) {
      input.value = params.get("q") || "";
    }

    function draw() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var yearValue = year ? year.value : "";
      var regionValue = region ? region.value.toLowerCase() : "";
      var items = window.searchIndex.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags].join(" ").toLowerCase();
        if (query && text.indexOf(query) === -1) {
          return false;
        }
        if (yearValue && movie.year !== yearValue) {
          return false;
        }
        if (regionValue && String(movie.region).toLowerCase().indexOf(regionValue) === -1) {
          return false;
        }
        return true;
      }).slice(0, 120);
      results.innerHTML = items.map(renderSearchCard).join("");
      if (empty) {
        empty.hidden = items.length !== 0;
      }
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var next = new URL(window.location.href);
        if (input && input.value.trim()) {
          next.searchParams.set("q", input.value.trim());
        } else {
          next.searchParams.delete("q");
        }
        window.history.replaceState(null, "", next.toString());
        draw();
      });
    }
    [input, year, region].forEach(function (field) {
      if (field) {
        field.addEventListener("input", draw);
        field.addEventListener("change", draw);
      }
    });
    draw();
  }

  function initPlayer() {
    var shells = document.querySelectorAll("[data-player]");
    shells.forEach(function (shell) {
      var button = shell.querySelector("[data-player-trigger]");
      var video = shell.querySelector("video");
      var message = shell.querySelector("[data-player-message]");
      if (!button || !video) {
        return;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text || "";
        }
      }

      function play() {
        var src = video.getAttribute("data-m3u8");
        if (!src) {
          setMessage("暂时无法播放，请稍后再试。");
          return;
        }
        shell.classList.add("is-playing");
        setMessage("");
        if (window.Hls && window.Hls.isSupported()) {
          if (video._hls) {
            video._hls.destroy();
          }
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          video._hls = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {
              setMessage("点击视频画面继续播放。");
            });
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setMessage("播放遇到问题，请稍后再试。");
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.play().catch(function () {
            setMessage("点击视频画面继续播放。");
          });
        } else {
          setMessage("暂时无法播放，请换用支持的浏览器。");
        }
      }

      button.addEventListener("click", play);
      video.addEventListener("click", function () {
        if (video.paused) {
          video.play().catch(function () {});
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initSearchPage();
    initPlayer();
  });
})();
