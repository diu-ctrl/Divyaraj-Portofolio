/**
 * BlurText - React Bits Component (Vanilla JS & Web Animations API Port)
 * 
 * Target headings:
 * 1. "A Glimpse Into My Practice" (#about-section .section-header h2.display-serif-statement)
 * 2. "Growth" (.about-pillars .pillar-col:nth-child(1) h3)
 * 3. "Cinema" (.about-pillars .pillar-col:nth-child(2) h3)
 * 4. "Code" (.about-pillars .pillar-col:nth-child(3) h3)
 * 
 * Props & Configuration (matching React Bits <BlurText />):
 * - effect: 'blur'
 * - animateBy: 'words'
 * - direction: 'top'
 * - distance: 50 (px)
 * - blur: 10 (px)
 * - delay: 200 (ms between words)
 * - stepDuration: 0.35 (seconds per step; totalDuration = 0.7s)
 * - trigger: 'view'
 * - threshold: 0.1
 * - loop: false
 * - focusOnHover: false
 */
(function() {
    'use strict';

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function applyBlurText(container, options = {}) {
        if (!container || container.dataset.blurTextInitialized === 'true') return;
        container.dataset.blurTextInitialized = 'true';

        if (prefersReducedMotion) return;

        const delay = Number(options.delay ?? container.dataset.delay ?? 200);
        const stepDuration = Number(options.stepDuration ?? container.dataset.stepDuration ?? 0.35);
        const blur = Number(options.blur ?? container.dataset.blur ?? 10);
        const distance = Number(options.distance ?? container.dataset.distance ?? 50);
        const direction = options.direction ?? container.dataset.direction ?? 'top';
        const globalDelay = Number(options.globalDelay ?? 0);
        const threshold = Number(options.threshold ?? 0.1);
        const triggerElement = options.triggerElement || container;

        const sign = direction === 'top' ? -1 : 1;

        // Process words while preserving DOM structure (<br>, <span class="gradient-text">)
        prepareWords(container);

        const wordSpans = Array.from(container.querySelectorAll('.blur-text-word'));
        if (wordSpans.length === 0) return;

        // Check if element is already scrolled past on initial page load
        const triggerRect = triggerElement.getBoundingClientRect();
        if (triggerRect.bottom < 0) {
            wordSpans.forEach(span => {
                span.style.opacity = '';
                span.style.filter = '';
                span.style.transform = '';
                span.style.willChange = '';
            });
            return;
        }

        // Set initial state (from)
        wordSpans.forEach(span => {
            span.style.opacity = '0';
            span.style.filter = `blur(${blur}px)`;
            span.style.transform = `translate3d(0, ${sign * distance}px, 0)`;
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, filter, opacity';
        });

        // Trigger when scrolling into view
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    obs.unobserve(entry.target);
                    animateWords();
                }
            });
        }, { threshold });

        observer.observe(triggerElement);

        function animateWords() {
            wordSpans.forEach((span, index) => {
                const wordDelay = globalDelay + index * delay;
                const anim = span.animate([
                    { filter: `blur(${blur}px)`, opacity: 0, transform: `translate3d(0, ${sign * distance}px, 0)` },
                    { filter: `blur(${blur * 0.5}px)`, opacity: 0.5, transform: `translate3d(0, ${-sign * distance * 0.1}px, 0)`, offset: 0.5 },
                    { filter: 'blur(0px)', opacity: 1, transform: 'translate3d(0, 0, 0)' }
                ], {
                    duration: stepDuration * 2 * 1000,
                    delay: wordDelay,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'forwards'
                });

                anim.onfinish = () => {
                    span.style.opacity = '';
                    span.style.filter = '';
                    span.style.transform = '';
                    span.style.willChange = '';
                    if (index === wordSpans.length - 1 && typeof options.onAnimationComplete === 'function') {
                        options.onAnimationComplete();
                    }
                };
            });
        }
    }

    function prepareWords(node) {
        // Collect text nodes to replace with word spans
        const textNodes = [];
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let curr;
        while ((curr = walker.nextNode())) {
            if (curr.textContent.trim().length > 0) {
                textNodes.push(curr);
            }
        }

        textNodes.forEach((tNode) => {
            const rawText = tNode.textContent;
            const tokens = rawText.split(/\s+/).filter(Boolean);
            if (tokens.length === 0) return;

            const frag = document.createDocumentFragment();
            tokens.forEach((token, idx) => {
                const isLast = idx === tokens.length - 1;
                const span = document.createElement('span');
                span.className = 'blur-text-word';
                // Trailing non-breaking space maintains natural word spacing
                span.textContent = isLast ? token : token + '\u00A0';
                frag.appendChild(span);
                if (!isLast) {
                    frag.appendChild(document.createTextNode(' '));
                }
            });

            tNode.parentNode.replaceChild(frag, tNode);
        });
    }

    function init() {
        // Declarative data-blur-text elements only
        document.querySelectorAll('[data-blur-text]').forEach(el => {
            applyBlurText(el);
        });
    }

    window.BlurText = {
        apply: applyBlurText,
        init: init
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
