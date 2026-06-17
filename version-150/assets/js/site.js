(function () {
    var header = document.querySelector('[data-header]');
    var menuToggle = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    function updateHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 8) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    if (menuToggle && mobilePanel) {
        menuToggle.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
        var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-slide-dot]'));
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-slide-dot')) || 0);
                start();
            });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        show(0);
        start();
    });

    document.querySelectorAll('[data-filter-grid]').forEach(function (grid) {
        var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));
        var scope = grid.closest('main') || document;
        var input = scope.querySelector('[data-filter-input]');
        var empty = scope.querySelector('[data-no-results]');
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';

        function normalized(value) {
            return String(value || '').toLowerCase().trim();
        }

        function cardText(card) {
            return normalized([
                card.getAttribute('data-title'),
                card.getAttribute('data-region'),
                card.getAttribute('data-genre'),
                card.getAttribute('data-year'),
                card.getAttribute('data-type'),
                card.textContent
            ].join(' '));
        }

        function applyFilter(value) {
            var query = normalized(value);
            var shown = 0;
            cards.forEach(function (card) {
                var matched = !query || cardText(card).indexOf(query) !== -1;
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-visible', shown === 0);
            }
        }

        if (input) {
            if (initial) {
                input.value = initial;
            }
            input.addEventListener('input', function () {
                applyFilter(input.value);
            });
        }

        scope.querySelectorAll('[data-filter-value]').forEach(function (button) {
            button.addEventListener('click', function () {
                var value = button.getAttribute('data-filter-value') || '';
                if (input) {
                    input.value = value;
                }
                applyFilter(value);
            });
        });

        applyFilter(input ? input.value : initial);
    });
})();
