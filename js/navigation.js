/**
 * Shared Floating Navigation JavaScript
 * Handles Scroll Spy, Smooth Scrolling, and page-specific Active States.
 */
(function() {
    const navItems = document.querySelectorAll('.limelight-nav-item');
    if (!navItems.length) return;

    // Detect current page
    const pathname = window.location.pathname;
    const isWorkPage = pathname.endsWith('work.html') || pathname.endsWith('work');

    // Scroll spy logic
    const heroSection = document.getElementById('hero');
    const contactSection = document.getElementById('contact');

    function scrollSpy() {
        const scrollPos = window.scrollY + window.innerHeight / 3;
        let activeIndex = isWorkPage ? 2 : 1; // Default: Work on work.html, About on index.html

        if (isWorkPage) {
            // On work page: top is Work (2), bottom is Contact (3)
            if (heroSection) {
                const heroHeight = heroSection.offsetHeight;
                if (window.scrollY < heroHeight * 0.7) {
                    activeIndex = 2; // Work is active
                }
            }
            if (contactSection) {
                const contactTop = contactSection.offsetTop;
                if (scrollPos >= contactTop) {
                    activeIndex = 3; // Contact is active
                }
            }
        } else {
            // On index page: top is Home (0), middle is About (1), bottom is Contact (3)
            if (heroSection) {
                const heroHeight = heroSection.offsetHeight;
                if (window.scrollY < heroHeight * 0.7) {
                    activeIndex = 0; // Home is active
                }
            }
            if (contactSection) {
                const contactTop = contactSection.offsetTop;
                if (scrollPos >= contactTop) {
                    activeIndex = 3; // Contact is active
                }
            }
        }

        // Force active index to Contact if user scrolled to absolute bottom
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
            activeIndex = 3;
        }

        navItems.forEach((item, idx) => {
            if (idx === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Click scrolling handlers
    navItems.forEach((item, idx) => {
        const href = item.getAttribute('href');

        item.addEventListener('click', (e) => {
            // Check if this link points to an anchor on the current page
            let isLocal = false;
            let targetHash = '';

            if (href.startsWith('#')) {
                isLocal = true;
                targetHash = href;
            } else if (href.includes('#')) {
                const [page, hash] = href.split('#');
                const currentPage = pathname.split('/').pop() || 'index.html';
                if (currentPage === page || (currentPage === 'index.html' && page === 'index.html') || (currentPage === '' && page === 'index.html') || (currentPage === 'work.html' && page === 'work.html')) {
                    isLocal = true;
                    targetHash = '#' + hash;
                }
            } else if (href === 'index.html' && !isWorkPage) {
                isLocal = true;
                targetHash = '#about';
            } else if (href === 'work.html' && isWorkPage) {
                isLocal = true;
                targetHash = '#hero';
            }

            if (isLocal) {
                e.preventDefault();
                if (targetHash === '#hero') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    history.pushState(null, null, '#hero');
                } else {
                    const targetSection = document.querySelector(targetHash);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                        history.pushState(null, null, targetHash);
                    }
                }
            }
        });
    });

    // Referrer-based scroll to About section when navigating from work.html
    if (!isWorkPage) {
        window.addEventListener('load', () => {
            if (!window.location.hash && document.referrer && (document.referrer.indexOf('work.html') !== -1 || document.referrer.indexOf('/work') !== -1)) {
                setTimeout(() => {
                    const aboutSection = document.getElementById('about');
                    if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 200);
            }
        });
    }

    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run
})();
