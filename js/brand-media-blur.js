/**
 * brand-media-blur.js
 * High-performance quick blur-in & blur-reveal effect for all brand page images and videos.
 *
 * Features:
 * - Ultra-lightweight IntersectionObserver with 60px rootMargin pre-trigger.
 * - Hardware-accelerated GPU transitions (opacity + filter: blur).
 * - Automatic GPU layer release (.settled) after transition to eliminate scroll lag & memory bloat.
 * - Seamless off-screen reset without flickering, re-triggering blur-in when scrolling back.
 * - Dynamic carousel / reel dot support so switched videos/posters blur in cleanly.
 * - MutationObserver to catch any dynamically loaded images or carousels.
 */

(() => {
    'use strict';

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Selector targeting brand content images and videos (excluding floating navigation icons)
    const TARGET_SELECTOR = 'img:not(#floatingNav img):not(.floating-nav img):not(.nav-drawer img):not([data-no-blur]), video:not(#floatingNav video):not(.floating-nav video):not([data-no-blur])';

    const TRANSITION_DURATION_MS = 450;
    const SETTLE_PADDING_MS = 40; // Total 490ms before releasing GPU layer

    let observer = null;

    function revealMedia(el) {
        if (!el || el.classList.contains('revealed')) return;

        // Ensure resetting is cleared before animating
        el.classList.remove('media-resetting');

        requestAnimationFrame(() => {
            el.classList.add('revealed');

            clearTimeout(el._settleTimer);
            el._settleTimer = setTimeout(() => {
                if (el.classList.contains('revealed')) {
                    el.classList.add('settled');
                }
            }, TRANSITION_DURATION_MS + SETTLE_PADDING_MS);
        });
    }

    function resetMedia(el) {
        if (!el || !el.classList.contains('revealed')) return;

        clearTimeout(el._settleTimer);

        // Instant reset off-screen without transition
        el.classList.add('media-resetting');
        el.classList.remove('revealed', 'settled');

        // Re-arm transition in next frame so it's ready when re-entering
        requestAnimationFrame(() => {
            el.classList.remove('media-resetting');
        });
    }

    function attachMediaElement(el) {
        if (!el || el._mediaBlurBound) return;
        el._mediaBlurBound = true;

        // Mark with base blur class
        el.classList.add('media-blur-reveal');

        if (observer) {
            observer.observe(el);
        } else {
            // Fallback if IntersectionObserver not available
            revealMedia(el);
        }
    }

    function initObserver() {
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll(TARGET_SELECTOR).forEach(revealMedia);
            return;
        }

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const el = entry.target;
                if (entry.isIntersecting) {
                    // If image is still downloading over network, wait for load event
                    if (el.tagName === 'IMG' && !el.complete) {
                        const onLoad = () => {
                            revealMedia(el);
                            el.removeEventListener('load', onLoad);
                        };
                        el.addEventListener('load', onLoad, { once: true });
                    } else {
                        revealMedia(el);
                    }
                } else {
                    // When scrolled outside the rootMargin boundary, reset off-screen
                    resetMedia(el);
                }
            });
        }, {
            root: null,
            // 60px margin pre-arms the transition just before reaching visible viewport
            rootMargin: '60px 0px 60px 0px',
            threshold: [0, 0.05]
        });
    }

    function scanAndAttach() {
        const elements = document.querySelectorAll(TARGET_SELECTOR);
        elements.forEach(attachMediaElement);
    }

    function hookDynamicInteractions() {
        // Support video dot navigation (phone stacks & carousels)
        document.addEventListener('click', (e) => {
            const dot = e.target.closest('.reel-dot, .carousel-dot, .cert-dot');
            if (!dot) return;

            // Find associated phone or gallery media
            const container = dot.closest('.phone-stack, .hero-right, .cert-carousel, .carousel-container') || document;
            const targetMedia = container.querySelectorAll('.phone-frame video, .phone-frame img, .reel-video, .cert-slide-img');

            targetMedia.forEach(media => {
                media.classList.remove('settled', 'revealed');
                media.classList.add('media-resetting');
                requestAnimationFrame(() => {
                    media.classList.remove('media-resetting');
                    revealMedia(media);
                });
            });
        }, { passive: true });

        // MutationObserver to seamlessly handle any lazy-rendered or dynamic nodes
        if ('MutationObserver' in window) {
            const mo = new MutationObserver(mutations => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (node.matches && node.matches(TARGET_SELECTOR)) {
                            attachMediaElement(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll(TARGET_SELECTOR).forEach(attachMediaElement);
                        }
                    }
                }
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }
    }

    function init() {
        initObserver();
        scanAndAttach();
        hookDynamicInteractions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
