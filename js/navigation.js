/**
 * Shared Floating Drawer Navigation JavaScript
 * Handles Pull-Down Drag (Desktop Open), Simple Click-to-Close (Desktop & Mobile),
 * Scroll Spy, and Active States.
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

    function getClosedY() {
        const topSpacing = isMobile() ? 10 : 16;
        const panelHeight = navPanel ? navPanel.offsetHeight : 64;
        return -(panelHeight + topSpacing);
    }

    function updateHandleLabel() {
        if (handleText) {
            handleText.textContent = isOpen ? 'CLOSE' : 'PULL DOWN';
        }
        if (chevronsIcon) {
            chevronsIcon.style.display = isOpen ? 'none' : 'inline-block';
        }
    }

    function openDrawer() {
        isOpen = true;
        navContainer.classList.add('is-open');
        navContainer.style.transform = '';
        handleBtn.setAttribute('aria-expanded', 'true');
        updateHandleLabel();
    }

    function closeDrawer() {
        isOpen = false;
        navContainer.classList.remove('is-open');
        navContainer.style.transform = '';
        handleBtn.setAttribute('aria-expanded', 'false');
        updateHandleLabel();
    }

    // Pointer Events for Desktop Drag Gesture (Pull Down to Open)
    handleBtn.addEventListener('pointerdown', (e) => {
        if (isMobile()) return;
        if (e.button !== 0) return; // Left mouse button only

        // Only handle drag when drawer is closed
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

        // Clamp translation between closedY and 15px overscroll
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
        const threshold = 45; // 45px drag threshold to open

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

    // Handle Click behavior (Desktop vs Mobile)
    handleBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // If click was triggered right after a drag-to-open gesture, ignore click
        if (justDragged) {
            justDragged = false;
            return;
        }

        if (isOpen) {
            // Clicking CLOSE when open ALWAYS closes the drawer on both desktop and mobile
            closeDrawer();
        } else {
            if (isMobile()) {
                // Mobile closed state: tap opens drawer
                openDrawer();
            }
        }
    });

    // Keyboard support (Enter/Space on handle, Escape on document)
    handleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen) closeDrawer();
            else openDrawer();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeDrawer();
        }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (isOpen && !navContainer.contains(e.target)) {
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
        });
    });

    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial run
})();
