/**
 * Shared Floating Navigation JavaScript
 * Handles Scroll Spy, Smooth Scrolling, and page-specific Active States.
 *
 * Configured WhatsApp URL source: https://wa.me/qr/KQJFSZ2WY5FSO1
 */
(function() {
    // Verified WhatsApp link configuration
    const VERIFIED_WHATSAPP_URL = 'https://wa.me/qr/KQJFSZ2WY5FSO1';

    const navItems = document.querySelectorAll('.limelight-nav-item');
    if (!navItems.length) return;

    // Detect current page
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop().toLowerCase() || 'index.html';
    const isAboutPage = filename === 'about.html' || filename === 'about';

    // Scroll spy logic
    const contactSection = document.getElementById('contact');

    function scrollSpy() {
        const scrollPos = window.scrollY + window.innerHeight / 3;
        let activeIndex = isAboutPage ? 0 : 1; // Default: About (0) on about.html, Work (1) on index.html

        // Check if Contact section is in view
        if (contactSection) {
            const contactTop = contactSection.offsetTop;
            if (scrollPos >= contactTop) {
                activeIndex = 2; // Contact is active
            }
        }

        // Force active index to Contact if user scrolled to absolute bottom
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
            activeIndex = 2;
        }

        navItems.forEach((item, idx) => {
            // WhatsApp (3) and Resume (4) do not get active scroll-spy state
            if (idx === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Click scrolling handlers
    navItems.forEach((item) => {
        const href = item.getAttribute('href');
        const targetAttr = item.getAttribute('data-target');

        item.addEventListener('click', (e) => {
            if (targetAttr === 'contact' || href === '#contact') {
                e.preventDefault();
                const contactEl = document.getElementById('contact');
                if (contactEl) {
                    contactEl.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, null, '#contact');
                }
            } else if (targetAttr === 'work' && !isAboutPage) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                history.pushState(null, null, '#hero');
            } else if (targetAttr === 'about' && isAboutPage) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                history.pushState(null, null, '#hero');
            }
        });
    });

    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run
})();
