/**
 * Mobile Circular 3D Gallery for Selected Web Work (#web-showcase)
 * Inspired by React Bits <CircularGallery />
 * Applies on mobile view (<= 768px) only.
 */
(function initMobileCircularGallery() {
    function setup() {
        const stage = document.getElementById('webCircStage');
        const viewport = document.getElementById('webCircViewport');
        if (!stage || !viewport) return;

        const cards = Array.from(stage.querySelectorAll('.web-circ-card'));
        const dots = Array.from(document.querySelectorAll('.web-circ-dot'));
        if (!cards.length) return;

        const N = cards.length;
        let currentPos = 0;
        let animId = null;

        function getCardStep() {
            const vpWidth = viewport.clientWidth || window.innerWidth;
            return Math.min(255, vpWidth * 0.66);
        }

        function render() {
            if (window.innerWidth > 768) return;

            const cardStep = getCardStep();
            let activeCardIndex = Math.round(currentPos) % N;
            if (activeCardIndex < 0) activeCardIndex += N;

            cards.forEach((card, i) => {
                let diff = (i - currentPos) % N;
                if (diff > N / 2) diff -= N;
                if (diff < -N / 2) diff += N;

                const absDiff = Math.abs(diff);

                if (absDiff > 1.8) {
                    card.style.opacity = '0';
                    card.style.pointerEvents = 'none';
                    card.style.transform = 'translate3d(0, 0, -400px) scale(0.6)';
                    card.classList.remove('is-active');
                    return;
                }

                const tx = diff * cardStep;
                const rotY = -diff * 22;
                const tz = -absDiff * 55;
                const scale = 1 - Math.min(0.2, absDiff * 0.12);
                const opacity = Math.max(0, 1 - absDiff * 0.42);
                const zIndex = Math.round(100 - absDiff * 20);

                card.style.transform = `translate3d(${tx.toFixed(1)}px, 0, ${tz.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
                card.style.opacity = opacity.toFixed(3);
                card.style.zIndex = zIndex;

                if (absDiff < 0.45) {
                    card.classList.add('is-active');
                    card.style.pointerEvents = 'auto';
                } else if (absDiff < 1.3) {
                    card.classList.remove('is-active');
                    card.style.pointerEvents = 'auto';
                } else {
                    card.classList.remove('is-active');
                    card.style.pointerEvents = 'none';
                }
            });

            dots.forEach((dot, idx) => {
                if (idx === activeCardIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        function animateTo(target) {
            cancelAnimationFrame(animId);
            const start = currentPos;
            const change = target - start;
            const duration = 380;
            const startTime = performance.now();

            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(1, elapsed / duration);
                const ease = 1 - Math.pow(1 - progress, 3);
                currentPos = start + change * ease;
                render();
                if (progress < 1) {
                    animId = requestAnimationFrame(step);
                } else {
                    currentPos = (target % N + N) % N;
                    render();
                }
            }
            animId = requestAnimationFrame(step);
        }

        // Touch & Pointer gesture tracking
        let startX = 0;
        let startY = 0;
        let lastX = 0;
        let lastTime = 0;
        let vx = 0;
        let startPos = 0;
        let isDragging = false;
        let isVerticalScroll = false;
        let didDrag = false;

        function handleStart(clientX, clientY) {
            cancelAnimationFrame(animId);
            startX = clientX;
            startY = clientY;
            lastX = clientX;
            lastTime = performance.now();
            vx = 0;
            startPos = currentPos;
            isDragging = false;
            isVerticalScroll = false;
            didDrag = false;
        }

        function handleMove(clientX, clientY, e) {
            if (isVerticalScroll) return;

            const dx = clientX - startX;
            const dy = clientY - startY;

            if (!isDragging) {
                if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
                    isVerticalScroll = true;
                    return;
                }
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 7) {
                    isDragging = true;
                    didDrag = true;
                }
            }

            if (isDragging) {
                if (e && e.cancelable) e.preventDefault();
                const now = performance.now();
                const dt = Math.max(1, now - lastTime);
                const deltaX = clientX - lastX;
                vx = deltaX / dt;
                lastX = clientX;
                lastTime = now;

                const cardStep = getCardStep();
                currentPos = startPos - dx / cardStep;
                render();
            }
        }

        function handleEnd() {
            if (isDragging) {
                const cardStep = getCardStep();
                let momentum = -vx * 120 / cardStep;
                momentum = Math.max(-0.9, Math.min(0.9, momentum));
                const target = Math.round(currentPos + momentum);
                animateTo(target);
            }
            isDragging = false;
        }

        // Touch event listeners on viewport
        viewport.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        viewport.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
            }
        }, { passive: false });

        viewport.addEventListener('touchend', handleEnd, { passive: true });
        viewport.addEventListener('touchcancel', handleEnd, { passive: true });

        // Mouse drag support for desktop DevTools emulation
        let isMouseDown = false;
        viewport.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            handleStart(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            handleMove(e.clientX, e.clientY, e);
        });
        window.addEventListener('mouseup', () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            handleEnd();
        });

        // Tap on card: if side card, bring to center; if center card button, navigate!
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (didDrag) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                const idx = parseInt(card.getAttribute('data-index'), 10);
                let diff = (idx - currentPos) % N;
                if (diff > N / 2) diff -= N;
                if (diff < -N / 2) diff += N;

                if (Math.abs(diff) >= 0.45) {
                    e.preventDefault();
                    e.stopPropagation();
                    animateTo(Math.round(currentPos + diff));
                }
            });
        });

        // Dots navigation
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
                let diff = (targetIdx - currentPos) % N;
                if (diff > N / 2) diff -= N;
                if (diff < -N / 2) diff += N;
                animateTo(Math.round(currentPos + diff));
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                render();
            }
        });

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
