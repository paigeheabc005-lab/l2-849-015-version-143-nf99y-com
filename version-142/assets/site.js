(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mainNav = document.querySelector('[data-main-nav]');
    if (menuButton && mainNav) {
      menuButton.addEventListener('click', function () {
        mainNav.classList.toggle('is-open');
      });
    }

    var slider = document.querySelector('[data-hero-slider]');
    if (slider) {
      var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
      var current = 0;
      var show = function (index) {
        current = index;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      };
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          show(i);
        });
      });
      if (slides.length > 1) {
        window.setInterval(function () {
          show((current + 1) % slides.length);
        }, 5600);
      }
    }

    var filterForm = document.querySelector('[data-filter-form]');
    var filterList = document.querySelector('[data-filter-list]');
    if (filterForm && filterList) {
      var input = filterForm.querySelector('[data-filter-input]');
      var region = filterForm.querySelector('[data-filter-region]');
      var type = filterForm.querySelector('[data-filter-type]');
      var cards = Array.prototype.slice.call(filterList.querySelectorAll('.movie-card'));
      var params = new URLSearchParams(window.location.search);
      if (input && params.get('q')) {
        input.value = params.get('q');
      }
      var apply = function () {
        var q = input ? input.value.trim().toLowerCase() : '';
        var regionValue = region ? region.value : '';
        var typeValue = type ? type.value : '';
        cards.forEach(function (card) {
          var text = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-year')
          ].join(' ').toLowerCase();
          var matchText = !q || text.indexOf(q) !== -1;
          var matchRegion = !regionValue || card.getAttribute('data-region') === regionValue;
          var matchType = !typeValue || card.getAttribute('data-type') === typeValue;
          card.classList.toggle('is-filter-hidden', !(matchText && matchRegion && matchType));
        });
      };
      filterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        apply();
      });
      [input, region, type].forEach(function (node) {
        if (node) {
          node.addEventListener('input', apply);
          node.addEventListener('change', apply);
        }
      });
      apply();
    }

    document.querySelectorAll('.player-frame').forEach(function (frame) {
      var video = frame.querySelector('video');
      var cover = frame.querySelector('.player-cover');
      var stream = frame.getAttribute('data-stream');
      var loaded = false;
      var hls = null;
      var load = function () {
        if (loaded || !video || !stream) {
          return;
        }
        loaded = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          video.src = stream;
        }
      };
      var play = function () {
        load();
        if (cover) {
          cover.classList.add('is-hidden');
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      };
      if (cover) {
        cover.addEventListener('click', play);
      }
      if (video) {
        video.addEventListener('play', function () {
          load();
          if (cover) {
            cover.classList.add('is-hidden');
          }
        });
        video.addEventListener('ended', function () {
          if (hls && typeof hls.destroy === 'function') {
            hls.destroy();
            hls = null;
            loaded = false;
          }
        });
      }
    });
  });
})();
