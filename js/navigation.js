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

    if (isWorkPage) {
        // On work.html: Work (index 2) is active by default. Other scrollspy is disabled.
        navItems.forEach((item, idx) => {
            if (idx === 2) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Intercept Work click to scroll smoothly to top
        const workItem = navItems[2];
        workItem.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        // On index.html: Scroll spy handles active state for Home, About, and Contact
        const heroSection = document.getElementById('hero');
        const contactSection = document.getElementById('contact');

        // Scroll spy logic
        function scrollSpy() {
            const scrollPos = window.scrollY + window.innerHeight / 3;
            let activeIndex = 1; // Default to About (index 1)

            // Check if hero is in view (near the top)
            if (heroSection) {
                const heroHeight = heroSection.offsetHeight;
                if (window.scrollY < heroHeight * 0.7) {
                    activeIndex = 0; // Home is active
                }
            }

            // Check if contact is in view
            if (contactSection) {
                const contactTop = contactSection.offsetTop;
                if (scrollPos >= contactTop) {
                    activeIndex = 3; // Contact is active
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

        // Click scrolling handlers for index.html links
        navItems.forEach((item, idx) => {
            const href = item.getAttribute('href');
            if (href.startsWith('#') || href === 'index.html' || href.startsWith('index.html#')) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (href === 'index.html' || href === '#hero' || href === 'index.html#hero') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Update hash without jump
                        history.pushState(null, null, '#hero');
                    } else {
                        const hash = href.includes('#') ? href.substring(href.indexOf('#')) : '';
                        const target = document.querySelector(hash);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                            history.pushState(null, null, hash);
                        }
                    }
                });
            }
        });

        window.addEventListener('scroll', scrollSpy);
        scrollSpy(); // Initial run
    }
})();
