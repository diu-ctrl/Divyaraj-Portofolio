/**
 * Shared Floating Drawer Navigation JavaScript
 * Handles Drawer Toggle, Scroll Spy, Smooth Scrolling, and page-specific Active States.
 *
 * Configured WhatsApp URL source: https://wa.me/qr/KQJFSZ2WY5FSO1
 */
(function() {
    const navContainer = document.getElementById('limelight-nav-container');
    const handleBtn = document.getElementById('limelight-drawer-handle');
    const navItems = document.querySelectorAll('.limelight-nav-item');

    if (!navContainer || !handleBtn || !navItems.length) return;

    // Detect current page
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop().toLowerCase() || 'index.html';
    const isAboutPage = filename === 'about.html' || filename === 'about';

    // Drawer state management
    function openDrawer() {
        navContainer.classList.add('is-open');
        handleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
        navContainer.classList.remove('is-open');
        handleBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleDrawer() {
        if (navContainer.classList.contains('is-open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }

    // Toggle drawer on handle button click
    handleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDrawer();
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (navContainer.classList.contains('is-open') && !navContainer.contains(e.target)) {
            closeDrawer();
        }
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navContainer.classList.contains('is-open')) {
            closeDrawer();
        }
    });

    // Scroll spy logic
    const contactSection = document.getElementById('contact');

    function scrollSpy() {
        const scrollPos = window.scrollY + window.innerHeight / 3;
        let activeIndex = isAboutPage ? 0 : 1; // Default: About (0) on about.html, Work (1) on index.html

        if (contactSection) {
            const contactTop = contactSection.offsetTop;
            if (scrollPos >= contactTop) {
                activeIndex = 2; // Contact is active
            }
        }

        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
            activeIndex = 2;
        }

        navItems.forEach((item, idx) => {
            if (idx === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Click scrolling and navigation handlers
    navItems.forEach((item) => {
        const href = item.getAttribute('href');
        const targetAttr = item.getAttribute('data-target');

        item.addEventListener('click', (e) => {
            if (targetAttr === 'contact' || href === '#contact') {
                e.preventDefault();
                closeDrawer();
                const contactEl = document.getElementById('contact');
                if (contactEl) {
                    contactEl.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, null, '#contact');
                }
            } else if (targetAttr === 'work') {
                if (!isAboutPage) {
                    e.preventDefault();
                    closeDrawer();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    history.pushState(null, null, '#hero');
                } else {
                    closeDrawer();
                }
            } else if (targetAttr === 'about') {
                if (isAboutPage) {
                    e.preventDefault();
                    closeDrawer();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    history.pushState(null, null, '#hero');
                } else {
                    closeDrawer();
                }
            }
            // WhatsApp and Resume links are external (target="_blank") and will open in a new tab without closing the drawer immediately.
        });
    });

    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run
})();
