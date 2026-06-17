(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  var hero = document.getElementById('heroCarousel');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    var show = function (nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    };

    var play = function () {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    };

    var restart = function () {
      if (timer) {
        window.clearInterval(timer);
      }
      play();
    };

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    show(0);
    play();
  }

  var normalize = function (text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  };

  var filterGrid = function (grid, query, typeValue) {
    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-movie-card]'));
    var visible = 0;
    var q = normalize(query);
    var type = typeValue || 'all';

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      var cardType = card.getAttribute('data-type') || '';
      var matchesText = !q || text.indexOf(q) !== -1;
      var matchesType = type === 'all' || cardType === type;
      var showCard = matchesText && matchesType;
      card.style.display = showCard ? '' : 'none';
      if (showCard) {
        visible += 1;
      }
    });

    var empty = document.querySelector('[data-empty-state="' + grid.id + '"]');
    if (empty) {
      empty.classList.toggle('is-visible', visible === 0);
    }
  };

  var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-input]'));

  searchInputs.forEach(function (input) {
    input.addEventListener('input', function () {
      var grid = document.getElementById(input.getAttribute('data-search-scope'));
      var activeButton = document.querySelector('[data-filter-scope="' + input.getAttribute('data-search-scope') + '"] button.is-active');
      var type = activeButton ? activeButton.getAttribute('data-filter-button') : 'all';
      filterGrid(grid, input.value, type);
    });
  });

  var filterGroups = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));

  filterGroups.forEach(function (group) {
    var scope = group.getAttribute('data-filter-scope');
    var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-filter-button]'));
    if (buttons.length) {
      buttons[0].classList.add('is-active');
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (item) {
          item.classList.remove('is-active');
        });
        button.classList.add('is-active');
        var input = document.querySelector('[data-search-scope="' + scope + '"]');
        var grid = document.getElementById(scope);
        filterGrid(grid, input ? input.value : '', button.getAttribute('data-filter-button'));
      });
    });
  });

  var startPlayer = function (player) {
    if (!player || player.classList.contains('is-playing')) {
      return;
    }

    var video = player.querySelector('video');
    var stream = player.getAttribute('data-stream');

    if (!video || !stream) {
      return;
    }

    player.classList.add('is-playing');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      video.play().catch(function () {});
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(stream);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      player._hls = hls;
      return;
    }

    video.src = stream;
    video.play().catch(function () {});
  };

  var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

  players.forEach(function (player) {
    var button = player.querySelector('[data-play-button]');
    var video = player.querySelector('video');

    if (button) {
      button.addEventListener('click', function () {
        startPlayer(player);
      });
    }

    if (video) {
      video.addEventListener('click', function () {
        startPlayer(player);
      }, { once: true });
    }
  });
})();
