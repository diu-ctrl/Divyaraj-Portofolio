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
    const filename = pathname.split('/').pop().toLowerCase() || 'index.html';
    const isAboutPage = filename === 'about.html' || filename === 'about';

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
        if (handleText) {
            if (isOpen && !isMobile()) {
                handleText.textContent = 'CLOSE';
            } else if (isMobile()) {
                handleText.textContent = 'TAP TO OPEN';
            } else {
                handleText.textContent = 'PULL DOWN';
            }
        }
        if (chevronsIcon) {
            chevronsIcon.style.display = (isOpen && !isMobile()) ? 'none' : 'inline-block';
        }
    }

    function clearHoverState() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        navContainer.classList.remove('is-hovered');
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

    // Navigation links click handlers
    navItems.forEach((item) => {
        const href = item.getAttribute('href');
        const targetAttr = item.getAttribute('data-target');

        item.addEventListener('click', (e) => {
            if (targetAttr === 'contact' || href === '#contact') {
                e.preventDefault();
                if (!isMobile()) closeDrawer(); // Do NOT close on mobile when tapping item
                const contactEl = document.getElementById('contact');
                if (contactEl) {
                    contactEl.scrollIntoView({ behavior: 'smooth' });
                    history.pushState(null, null, '#contact');
                }
            } else if (targetAttr === 'work') {
                if (!isAboutPage) {
                    e.preventDefault();
                    if (!isMobile()) closeDrawer();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    history.pushState(null, null, '#hero');
                } else {
                    if (!isMobile()) closeDrawer();
                }
            } else if (targetAttr === 'about') {
                if (isAboutPage) {
                    e.preventDefault();
                    if (!isMobile()) closeDrawer();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    history.pushState(null, null, '#hero');
                } else {
                    if (!isMobile()) closeDrawer();
                }
            }
        });
    });

    window.addEventListener('resize', updateHandleLabel);
    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run
})();
