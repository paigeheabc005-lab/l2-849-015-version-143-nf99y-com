
(function () {
  var heroTimer = null;

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNavigation();
    initHeroCarousel();
    initFilterPanels();
    initSearchPage();
    initPlayer();
  });

  function initMobileNavigation() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-nav]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      menu.hidden = !menu.hidden;
    });
  }

  function initHeroCarousel() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
    var current = 0;

    if (slides.length <= 1) {
      return;
    }

    function showSlide(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });

      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle('is-active', thumbIndex === current);
      });
    }

    function restartTimer() {
      if (heroTimer) {
        window.clearInterval(heroTimer);
      }

      heroTimer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')));
        restartTimer();
      });
    });

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        showSlide(Number(thumb.getAttribute('data-hero-thumb')));
        restartTimer();
      });
    });

    showSlide(0);
    restartTimer();
  }

  function initFilterPanels() {
    var panels = document.querySelectorAll('[data-filter-panel]');

    panels.forEach(function (panel) {
      var root = panel.closest('section') || document;
      var cards = Array.prototype.slice.call(root.querySelectorAll('[data-filterable-card]'));
      var inputs = Array.prototype.slice.call(panel.querySelectorAll('[data-filter]'));
      var reset = panel.querySelector('[data-filter-reset]');
      var emptyState = root.querySelector('[data-empty-state]');

      function applyFilters() {
        var filters = {};

        inputs.forEach(function (input) {
          filters[input.getAttribute('data-filter')] = input.value.trim().toLowerCase();
        });

        var visibleCount = 0;

        cards.forEach(function (card) {
          var typeText = (card.getAttribute('data-type') || '').toLowerCase();
          var regionText = (card.getAttribute('data-region') || '').toLowerCase();
          var keywordTarget = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-genre') || '',
            card.textContent || ''
          ].join(' ').toLowerCase();

          var matchesType = !filters.type || typeText === filters.type;
          var matchesRegion = !filters.region || regionText === filters.region;
          var matchesKeyword = !filters.keyword || keywordTarget.indexOf(filters.keyword) !== -1;
          var isVisible = matchesType && matchesRegion && matchesKeyword;

          card.hidden = !isVisible;

          if (isVisible) {
            visibleCount += 1;
          }
        });

        if (emptyState) {
          emptyState.hidden = visibleCount !== 0;
        }
      }

      inputs.forEach(function (input) {
        input.addEventListener('input', applyFilters);
        input.addEventListener('change', applyFilters);
      });

      if (reset) {
        reset.addEventListener('click', function () {
          inputs.forEach(function (input) {
            input.value = '';
          });
          applyFilters();
        });
      }
    });
  }

  function initSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var status = document.querySelector('[data-search-status]');
    var data = window.MOVIE_INDEX || [];

    if (!results || !data.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim();
    var input = document.querySelector('[data-search-input]');

    if (input) {
      input.value = query;
    }

    if (!query) {
      return;
    }

    var normalizedQuery = query.toLowerCase();
    var matches = data.filter(function (movie) {
      var haystack = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.oneLine,
        (movie.tags || []).join(' ')
      ].join(' ').toLowerCase();

      return haystack.indexOf(normalizedQuery) !== -1;
    });

    results.innerHTML = matches.slice(0, 120).map(renderSearchCard).join('');

    if (status) {
      if (matches.length) {
        status.textContent = '搜索“' + query + '”共找到 ' + matches.length + ' 部相关影片，当前显示前 ' + Math.min(matches.length, 120) + ' 部。';
      } else {
        status.textContent = '没有找到与“' + query + '”匹配的影片，请尝试更换关键词。';
      }
    }
  }

  function renderSearchCard(movie) {
    var safeTitle = escapeHtml(movie.title);
    var safeLine = escapeHtml(movie.oneLine || '');
    var tags = (movie.tags || []).slice(0, 4).map(function (tag) {
      return '<span class="tag-chip">' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card">',
      '  <a class="movie-poster" href="' + escapeAttribute(movie.url) + '" aria-label="观看 ' + safeTitle + '">',
      '    <img src="' + escapeAttribute(movie.cover) + '" alt="' + safeTitle + ' 海报" loading="lazy" onerror="this.parentElement.classList.add(\'poster-missing\'); this.remove();">',
      '    <span class="poster-play" aria-hidden="true">▶</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <div class="movie-card-meta">',
      '      <span>' + escapeHtml(movie.year || '') + '</span>',
      '      <span>' + escapeHtml(movie.region || '') + '</span>',
      '      <span>' + escapeHtml(movie.type || '') + '</span>',
      '    </div>',
      '    <h3><a href="' + escapeAttribute(movie.url) + '">' + safeTitle + '</a></h3>',
      '    <p>' + safeLine + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  function initPlayer() {
    var player = document.querySelector('[data-player]');

    if (!player) {
      return;
    }

    var video = player.querySelector('video');
    var button = player.querySelector('[data-play]');
    var message = player.querySelector('[data-player-message]');
    var source = player.getAttribute('data-src') || (video && video.getAttribute('data-src'));
    var hlsInstance = null;

    if (!video || !source) {
      setPlayerMessage(message, '播放器缺少视频源。');
      return;
    }

    function startPlayback() {
      player.classList.add('is-playing');

      if (!video.dataset.loaded) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);

          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setPlayerMessage(message, '视频加载遇到问题，请刷新页面或稍后重试。');
            }
          });
        } else {
          video.src = source;
        }

        video.controls = true;
        video.dataset.loaded = 'true';
      }

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          setPlayerMessage(message, '浏览器阻止了自动播放，请再次点击播放器。');
        });
      }
    }

    if (button) {
      button.addEventListener('click', startPlayback);
    }

    video.addEventListener('click', function () {
      if (!video.dataset.loaded || video.paused) {
        startPlayback();
      }
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance && typeof hlsInstance.destroy === 'function') {
        hlsInstance.destroy();
      }
    });
  }

  function setPlayerMessage(element, text) {
    if (element) {
      element.textContent = text;
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }
})();
