(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        "\"": "&quot;"
      }[char];
    });
  }

  function bindMenu() {
    var toggle = $("[data-menu-toggle]");
    var panel = $("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      toggle.textContent = panel.classList.contains("is-open") ? "×" : "☰";
    });
  }

  function bindSearchForms() {
    $all("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        if (query) {
          window.location.href = "./search.html?q=" + encodeURIComponent(query);
        }
      });
    });
  }

  function bindHero() {
    var hero = $("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = $all(".hero-slide", hero);
    var dots = $all(".hero-dot", hero);
    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }

    function next() {
      show(current + 1);
    }

    function start() {
      stop();
      timer = setInterval(next, 5000);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
      }
    }

    var prevButton = $("[data-hero-prev]", hero);
    var nextButton = $("[data-hero-next]", hero);

    if (prevButton) {
      prevButton.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function bindFilters() {
    var buttons = $all("[data-filter]");
    if (!buttons.length) {
      return;
    }
    var cards = $all("[data-card-key]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var value = button.getAttribute("data-filter").toLowerCase();
        buttons.forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        cards.forEach(function (card) {
          var key = card.getAttribute("data-card-key") || "";
          card.style.display = value === "all" || key.indexOf(value) !== -1 ? "" : "none";
        });
      });
    });
  }

  function bindBackTop() {
    var button = $("[data-back-top]");
    if (!button) {
      return;
    }
    window.addEventListener("scroll", function () {
      button.classList.toggle("is-visible", window.scrollY > 320);
    });
    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  function bindPlayers() {
    $all(".player-box").forEach(function (box) {
      var video = box.querySelector("video");
      var overlay = box.querySelector(".play-overlay");
      var stream = box.getAttribute("data-stream");
      var ready = false;
      var hls;

      function loadVideo() {
        if (ready || !video || !stream) {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          video.src = stream;
        }
        ready = true;
      }

      function playVideo() {
        loadVideo();
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            if (overlay) {
              overlay.classList.remove("is-hidden");
            }
          });
        }
      }

      if (overlay) {
        overlay.addEventListener("click", playVideo);
      }

      if (video) {
        video.addEventListener("play", function () {
          if (overlay) {
            overlay.classList.add("is-hidden");
          }
        });
        video.addEventListener("click", function () {
          if (video.paused) {
            playVideo();
          }
        });
      }

      window.addEventListener("pagehide", function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  function renderSearch() {
    var root = $("[data-search-results]");
    if (!root || !window.SEARCH_INDEX) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim().toLowerCase();
    var input = $("[data-main-search]");
    if (input) {
      input.value = query;
    }
    if (!query) {
      root.innerHTML = '<div class="empty-state">输入片名、地区、类型或关键词，快速查找想看的内容。</div>';
      return;
    }
    var results = window.SEARCH_INDEX.filter(function (item) {
      return item.key.indexOf(query) !== -1;
    });
    if (!results.length) {
      root.innerHTML = '<div class="empty-state">没有找到匹配的影片。</div>';
      return;
    }
    root.innerHTML = '<div class="movie-grid wide">' + results.map(function (item) {
      return '<article class="movie-card">' +
        '<a href="' + escapeHTML(item.url) + '">' +
        '<div class="poster-wrap">' +
        '<img src="' + escapeHTML(item.poster) + '" alt="' + escapeHTML(item.title) + '" loading="lazy">' +
        '<span class="year-badge">' + escapeHTML(item.year) + '</span>' +
        '<div class="poster-hover"><p>' + escapeHTML(item.oneLine) + '</p></div>' +
        '</div>' +
        '<div class="card-body">' +
        '<h3>' + escapeHTML(item.title) + '</h3>' +
        '<div class="card-meta"><span>' + escapeHTML(item.region) + '</span><span>' + escapeHTML(item.type) + '</span></div>' +
        '<div class="card-tags"><span>' + escapeHTML(item.category) + '</span></div>' +
        '</div>' +
        '</a>' +
        '</article>';
    }).join("") + '</div>';
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindMenu();
    bindSearchForms();
    bindHero();
    bindFilters();
    bindBackTop();
    bindPlayers();
    renderSearch();
  });
})();
