(function () {
  var hlsReady = null;

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    if (hlsReady) {
      return hlsReady;
    }

    hlsReady = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return hlsReady;
  }

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupFilters() {
    document.querySelectorAll('[data-filter-root]').forEach(function (root) {
      var input = root.querySelector('.filter-input');
      var chips = root.querySelectorAll('.filter-chip');
      var cards = root.querySelectorAll('.movie-card');
      var empty = root.querySelector('.result-empty');
      var activeValue = 'all';

      function textOf(card) {
        return [
          card.dataset.title,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.tags,
          card.dataset.year,
          card.dataset.type
        ].join(' ').toLowerCase();
      }

      function applyFilter() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var visible = 0;

        cards.forEach(function (card) {
          var text = textOf(card);
          var chipMatch = activeValue === 'all' || text.indexOf(activeValue.toLowerCase()) !== -1;
          var queryMatch = !query || text.indexOf(query) !== -1;
          var show = chipMatch && queryMatch;
          card.style.display = show ? '' : 'none';
          if (show) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }

      if (input) {
        input.addEventListener('input', applyFilter);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (item) {
            item.classList.remove('is-active');
          });
          chip.classList.add('is-active');
          activeValue = chip.dataset.filterValue || 'all';
          applyFilter();
        });
      });

      applyFilter();
    });
  }

  function setupSearchPage() {
    var root = document.querySelector('[data-search-page]');

    if (!root || !window.SEARCH_INDEX) {
      return;
    }

    var form = root.querySelector('form');
    var input = root.querySelector('input[name="q"]');
    var grid = root.querySelector('.movie-grid');
    var empty = root.querySelector('.result-empty');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function render(value) {
      var keyword = value.trim().toLowerCase();
      var results = window.SEARCH_INDEX.filter(function (item) {
        var text = [item.title, item.region, item.genre, item.tags, item.year, item.type].join(' ').toLowerCase();
        return !keyword || text.indexOf(keyword) !== -1;
      }).slice(0, 120);

      grid.innerHTML = results.map(function (item) {
        return '<article class="movie-card">' +
          '<a href="' + escapeHtml(item.url) + '" class="movie-card-link">' +
            '<div class="poster-frame">' +
              '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
              '<span class="poster-badge">' + escapeHtml(item.region) + '</span>' +
            '</div>' +
            '<div class="movie-card-body">' +
              '<h2>' + escapeHtml(item.title) + '</h2>' +
              '<p class="movie-meta">' + escapeHtml(item.year) + ' · ' + escapeHtml(item.type) + ' · ' + escapeHtml(item.genre) + '</p>' +
              '<p class="movie-line">' + escapeHtml(item.oneLine) + '</p>' +
            '</div>' +
          '</a>' +
        '</article>';
      }).join('');

      if (empty) {
        empty.classList.toggle('is-visible', results.length === 0);
      }
    }

    if (input) {
      input.value = query;
      input.addEventListener('input', function () {
        render(input.value);
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        render(input ? input.value : '');
      });
    }

    render(query);
  }

  function setupPlayers() {
    document.querySelectorAll('.js-player').forEach(function (player) {
      var video = player.querySelector('video');
      var overlay = player.querySelector('.player-overlay');
      var button = player.querySelector('.player-button');
      var stream = player.dataset.stream;
      var hlsInstance = null;
      var prepared = false;

      if (!video || !stream) {
        return;
      }

      function prepare() {
        if (prepared) {
          return Promise.resolve();
        }

        prepared = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          return Promise.resolve();
        }

        return loadHls().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            hlsInstance.loadSource(stream);
            hlsInstance.attachMedia(video);
          } else {
            video.src = stream;
          }
        }).catch(function () {
          video.src = stream;
        });
      }

      function play() {
        prepare().then(function () {
          if (overlay) {
            overlay.classList.add('is-hidden');
          }
          video.setAttribute('controls', 'controls');
          var promise = video.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
              video.setAttribute('controls', 'controls');
            });
          }
        });
      }

      prepare();

      if (button) {
        button.addEventListener('click', play);
      }

      if (overlay) {
        overlay.addEventListener('click', play);
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupFilters();
    setupSearchPage();
    setupPlayers();
  });
})();
