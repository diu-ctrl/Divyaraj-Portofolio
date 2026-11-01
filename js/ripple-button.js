/**
 * Direction-Aware Spreading Ripple Button Engine
 * Features:
 * - Dynamic entry-point calculation on mouseenter (origin anchors at exact contact coordinate)
 * - Direction-aware expanding radial clip-path across button bounds
 * - Dual-layer typography transformation for seamless pixel-accurate contrast
 * - Direction-aware smooth collapse toward mouse exit point on mouseleave
 * - Automatic initialization across all button variants across the portfolio
 * 
 * Theme Rules:
 * 1. White background buttons (e.g. .btn-explore-capsule)
 *    Base: White capsule, Black text, White border (no orange border or font in idle state)
 *    Hover ripple: Spreads in Orange (#EB4604) with White text
 * 2. Dark/Transparent outline buttons (e.g. .btn-outline, .btn-brutalist-outline, .back-btn, .social-mail-btn, .brand-nav-btn, .nav-capsule)
 *    Base: Dark/Transparent background, White text, Hairline border
 *    Hover ripple: Spreads in Orange (#EB4604) with White text
 * 3. Orange primary buttons (e.g. .btn-primary-gold, .download-pdf-btn)
 *    Base: Orange background (#EB4604), Black text
 *    Hover ripple: Spreads in White (#FFFFFF) with Black text
 */

(function () {
    'use strict';

    function initRippleButtons() {
        const selectors = [
            '.btn-explore-capsule',
            '.btn-primary-gold',
            '.btn-outline',
            '.btn-brutalist-outline',
            '.back-btn',
            '.social-mail-btn',
            '.download-pdf-btn',
            '.nav-capsule',
            '.brand-nav-btn:not(.dc-home)',
            '.tab-btn',
            '.case-study-btn'
        ];

        const buttons = document.querySelectorAll(selectors.join(', '));
        buttons.forEach(btn => {
            if (btn.dataset.rippleInit === 'true') return;
            btn.dataset.rippleInit = 'true';

            // Determine Theme
            let theme = 'theme-dark-to-orange';
            if (btn.classList.contains('btn-explore-capsule')) {
                theme = 'theme-white-to-orange';
            } else if (btn.classList.contains('btn-primary-gold') || btn.classList.contains('download-pdf-btn')) {
                theme = 'theme-orange-to-white';
            } else {
                theme = 'theme-dark-to-orange';
            }

            btn.classList.add('btn-ripple-container', theme);

            // Wrap content if not already wrapped
            let base = btn.querySelector('.btn-label-base');
            let overlay = btn.querySelector('.btn-ripple-overlay');

            if (!base || !overlay) {
                const rawHtml = btn.innerHTML;
                btn.innerHTML = '';

                base = document.createElement('span');
                base.className = 'btn-label-base';
                base.innerHTML = rawHtml;

                overlay = document.createElement('span');
                overlay.className = 'btn-ripple-overlay';
                overlay.setAttribute('aria-hidden', 'true');
                overlay.innerHTML = rawHtml;

                btn.appendChild(base);
                btn.appendChild(overlay);
            }

            // Direction-Aware Geometry Handlers
            btn.addEventListener('mouseenter', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const w = rect.width;
                const h = rect.height;

                // Max distance from contact point (x, y) to any of the 4 bounding box corners
                const maxDist = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 6;

                overlay.style.transition = 'none';
                overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
                void overlay.offsetWidth; // Force reflow

                overlay.style.transition = 'clip-path 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
                overlay.style.clipPath = `circle(${maxDist}px at ${x}px ${y}px)`;
            });

            btn.addEventListener('mouseleave', (e) => {
                const rect = btn.getBoundingClientRect();
                const exitX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                const exitY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

                overlay.style.transition = 'clip-path 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
                overlay.style.clipPath = `circle(0px at ${exitX}px ${exitY}px)`;
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRippleButtons);
    } else {
        initRippleButtons();
    }
})();
