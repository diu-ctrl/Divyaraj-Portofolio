/**
 * Shared Floating Drawer Navigation JavaScript
 * Handles Pull-Down Drag (Desktop Open), Simple Click-to-Close (Desktop Only),
 * Tap-to-Open & Persistent Open (Mobile), Scroll Spy, and Active States.
 *
 * Configured WhatsApp URL source: https://wa.me/qr/KQJFSZ2WY5FSO1
 */
(function() {
    const navContainer = document.getElementById('limelight-nav-container');
    const handleBtn = document.getElementById('limelight-drawer-handle');
    const handleText = document.getElementById('drawer-handle-text');
    const chevronsIcon = document.getElementById('drawer-chevrons-icon');
    const navPanel = document.getElementById('limelight-nav-panel');
    const navItems = document.querySelectorAll('.limelight-nav-item');

    if (!navContainer || !handleBtn || !navItems.length) return;

    // Detect current page
    const pathname = window.location.pathname;
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const isHomePage = cleanPath === '' || cleanPath === 'index.html' || cleanPath === 'index';
    const isAboutPage = cleanPath === 'about' || cleanPath === 'about.html';

    const isMobile = () => window.innerWidth < 768;

    let isOpen = false;
    let isDragging = false;
    let startY = 0;
    let initialY = 0;
    let justDragged = false;
    let hoverTimer = null;

    function getClosedY() {
        const topSpacing = isMobile() ? 20 : 16;
        const panelHeight = navPanel ? navPanel.offsetHeight : 64;
        return -(panelHeight + topSpacing);
    }

        function updateHandleLabel() {
        if (!handleText) return;
        const isMob = isMobile();
        if (isMob) {
            handleText.textContent = 'TAP TO OPEN';
        } else if (isOpen) {
            handleText.textContent = 'CLOSE';
        } else {
            handleText.textContent = 'PULL DOWN';
        }
        if (chevronsIcon) {
            chevronsIcon.style.display = (isOpen && !isMob) ? 'none' : 'inline-block';
        }
    }

    function clearHoverState() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        navContainer.classList.remove('is-hovered');
        handleBtn.classList.remove('has-function-hover');
        updateHandleLabel();
    }

    function openDrawer() {
        isOpen = true;
        clearHoverState();
        navContainer.classList.add('is-open');
        navContainer.style.transform = '';
        handleBtn.setAttribute('aria-expanded', 'true');
        updateHandleLabel();
    }

    function closeDrawer() {
        isOpen = false;
        clearHoverState();
        navContainer.classList.remove('is-open');
        navContainer.style.transform = '';
        handleBtn.setAttribute('aria-expanded', 'false');
        handleBtn.classList.remove('has-function-hover');
        updateHandleLabel();
    }

    // ── Shared Pointer Hover State Management (Desktop Only) ──
    navContainer.addEventListener('pointerenter', () => {
        if (!isOpen || isMobile()) return;
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        navContainer.classList.add('is-hovered');
    });

    navContainer.addEventListener('pointerleave', () => {
        if (isMobile()) return;
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            navContainer.classList.remove('is-hovered');
            hoverTimer = null;
        }, 90);
    });

    navContainer.addEventListener('pointercancel', clearHoverState);
    window.addEventListener('blur', clearHoverState);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearHoverState();
    });

    // Pointer Events for Desktop Drag Gesture (Pull Down to Open)
    handleBtn.addEventListener('pointerdown', (e) => {
        if (isMobile()) return;
        if (e.button !== 0) return; // Left mouse button only

        if (isOpen) return;

        e.preventDefault();
        try {
            handleBtn.setPointerCapture(e.pointerId);
        } catch (err) {}

        isDragging = true;
        justDragged = false;
        startY = e.clientY;

        const closedY = getClosedY();
        initialY = closedY;

        navContainer.classList.add('is-dragging');
        handleBtn.classList.add('is-grabbing');
    });

    handleBtn.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const deltaY = e.clientY - startY;

        const closedY = getClosedY();
        let targetY = initialY + deltaY;

        targetY = Math.max(closedY - 10, Math.min(20, targetY));

        navContainer.style.transform = `translateX(-50%) translateY(${targetY}px)`;
    });

    function endDrag(e) {
        if (!isDragging) return;

        isDragging = false;
        navContainer.classList.remove('is-dragging');
        handleBtn.classList.remove('is-grabbing');

        try {
            handleBtn.releasePointerCapture(e.pointerId);
        } catch (err) {}

        const deltaY = e.clientY - startY;
        const threshold = 45;

        if (deltaY >= threshold) {
            justDragged = true;
            openDrawer();
            setTimeout(() => { justDragged = false; }, 200);
        } else {
            closeDrawer();
        }
    }

    handleBtn.addEventListener('pointerup', endDrag);
    handleBtn.addEventListener('pointercancel', endDrag);

    // Handle Click behavior
    handleBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        if (justDragged) {
            justDragged = false;
            return;
        }

        if (isMobile()) {
            // Mobile: tap PULL DOWN opens drawer. Once open, handle is hidden.
            if (!isOpen) {
                openDrawer();
            }
        } else {
            // Desktop: clicking CLOSE closes drawer
            if (isOpen) {
                closeDrawer();
            }
        }
    });

    // Keyboard support (Enter/Space on handle, Escape on document for Desktop)
    handleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen) closeDrawer();
            else openDrawer();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!isMobile() && e.key === 'Escape' && isOpen) {
            closeDrawer();
        }
    });

    // Click outside to close (Desktop Only)
    document.addEventListener('click', (e) => {
        if (!isMobile() && isOpen && !navContainer.contains(e.target)) {
            closeDrawer();
        }
    });

    // Scroll spy logic
    const contactSection = document.getElementById('contact');

    function scrollSpy() {
        if (!isHomePage && !isAboutPage) {
            navItems.forEach((item) => item.classList.remove('active'));
            return;
        }

        const scrollPos = window.scrollY + window.innerHeight / 3;
        let activeIndex = isAboutPage ? 0 : 1;

        if (contactSection) {
            const contactTop = contactSection.offsetTop;
            if (scrollPos >= contactTop) {
                activeIndex = 2;
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

    // Navigation links hover & click handlers
    navItems.forEach((item) => {
        const href = item.getAttribute('href');
        const targetAttr = item.getAttribute('data-target');
        const tooltipEl = item.querySelector('.nav-tooltip');
        const functionName = tooltipEl ? tooltipEl.textContent.trim() : (targetAttr ? targetAttr.charAt(0).toUpperCase() + targetAttr.slice(1) : '');

        // Dynamic function label on hover: adds has-item-hover to cleanly hide CLOSE and show only function text
        item.addEventListener('mouseenter', () => {
            if (!isMobile()) {
                navContainer.classList.add('has-item-hover');
            }
        });

        item.addEventListener('mouseleave', () => {
            if (!isMobile()) {
                navContainer.classList.remove('has-item-hover');
            }
        });

        item.addEventListener('click', (e) => {
            if (targetAttr === 'contact' || href === '#contact') {
                const contactEl = document.getElementById('contact');
                if (contactEl) {
                    e.preventDefault();
                    if (!isMobile()) closeDrawer();
                    contactEl.scrollIntoView({ behavior: 'smooth' });
                    if (history.replaceState) history.replaceState(null, '', window.location.pathname);
                } else {
                    if (!isMobile()) closeDrawer();
                    sessionStorage.setItem('dc_scroll_to_contact', '1');
                    window.location.href = '/';
                }
            } else if (targetAttr === 'work') {
                if (isHomePage) {
                    e.preventDefault();
                    if (!isMobile()) closeDrawer();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (history.replaceState) history.replaceState(null, '', window.location.pathname);
                } else {
                    if (!isMobile()) closeDrawer();
                    window.location.href = '/';
                }
            } else if (targetAttr === 'about') {
                if (isAboutPage) {
                    e.preventDefault();
                    if (!isMobile()) closeDrawer();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (history.replaceState) history.replaceState(null, '', window.location.pathname);
                } else {
                    if (!isMobile()) closeDrawer();
                    window.location.href = '/about';
                }
            }
        });
    });

    // Check for pending scroll to contact from cross-page redirect
    if (sessionStorage.getItem('dc_scroll_to_contact') === '1') {
        sessionStorage.removeItem('dc_scroll_to_contact');
        setTimeout(() => {
            const contactEl = document.getElementById('contact');
            if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    }

    // Clean any legacy hash from URL without breaking in-page scroll
    if (window.location.hash) {
        try {
            const targetEl = document.querySelector(window.location.hash);
            if (targetEl) {
                setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } catch (_) {}
        if (history.replaceState) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    // Intercept internal hash clicks to prevent dirtying address bar with #
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        try {
            const target = document.querySelector(hash);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                if (history.replaceState) {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            }
        } catch (_) {}
    });

    window.addEventListener('resize', updateHandleLabel);
    window.addEventListener('orientationchange', updateHandleLabel);
    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run
})();
