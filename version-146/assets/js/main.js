(function () {
    var navButton = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.site-nav');

    if (navButton && nav) {
        navButton.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    var slider = document.querySelector('[data-slider]');

    if (slider) {
        var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
        var activeIndex = 0;

        function showSlide(index) {
            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === activeIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === activeIndex);
            });
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                showSlide(dotIndex);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(activeIndex + 1);
            }, 5200);
        }
    }

    var movieList = document.querySelector('.js-movie-list');
    var searchInput = document.querySelector('.js-movie-search');
    var resetButton = document.querySelector('.js-reset-search');
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));

    if (movieList && searchInput) {
        var cards = Array.prototype.slice.call(movieList.children);
        var activeFilter = 'all';
        var empty = document.createElement('div');
        empty.className = 'no-results';
        empty.textContent = '没有找到相关影片';

        function applyFilter() {
            var query = searchInput.value.trim().toLowerCase();
            var visible = 0;

            cards.forEach(function (card) {
                var text = card.textContent.toLowerCase();
                var typed = card.getAttribute('data-genre') || '';
                var matchedQuery = !query || text.indexOf(query) !== -1;
                var matchedFilter = activeFilter === 'all' || text.indexOf(activeFilter.toLowerCase()) !== -1 || typed.indexOf(activeFilter) !== -1;
                var matched = matchedQuery && matchedFilter;
                card.style.display = matched ? '' : 'none';

                if (matched) {
                    visible += 1;
                }
            });

            if (!visible) {
                if (!empty.parentNode) {
                    movieList.appendChild(empty);
                }
            } else if (empty.parentNode) {
                empty.parentNode.removeChild(empty);
            }
        }

        searchInput.addEventListener('input', applyFilter);

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                searchInput.value = '';
                activeFilter = 'all';
                filterButtons.forEach(function (button) {
                    button.classList.toggle('is-active', button.getAttribute('data-filter') === 'all');
                });
                applyFilter();
            });
        }

        filterButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                activeFilter = button.getAttribute('data-filter') || 'all';
                filterButtons.forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                applyFilter();
            });
        });

        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q');

        if (initialQuery) {
            searchInput.value = initialQuery;
            applyFilter();
        }
    }
})();
