/**
 * Dynamically computes and updates the geometric stepped border and glass backdrop
 * for the Brutalist Contact section.
 * Encloses the Contact Info (left) and 3D Video (right) in an L-shaped stepped card,
 * leaving the copyright text cleanly in the lower-left negative notch.
 */
(function() {
    function initSteppedContactCard() {
        const block = document.querySelector('.brutalist-contact-block');
        const infoLeft = document.getElementById('contactInfoLeft');
        const videoRight = document.getElementById('contactVideoRight');
        const pathEl = document.getElementById('steppedPath');
        const backdrop = document.getElementById('steppedBackdrop');

        if (!block || !infoLeft || !videoRight || !pathEl) return;

        function update() {
            const w = block.offsetWidth;
            const hLeft = infoLeft.offsetHeight;
            const hRight = videoRight.offsetHeight;
            const r = 22; // corner radius matching the portfolio theme

            // Check if video is stacked (mobile) or side-by-side (desktop)
            const isStacked = (videoRight.offsetTop > infoLeft.offsetTop + 60);

            let d = '';
            if (isStacked || w < 768) {
                // Mobile: clean rounded rectangle enclosing infoLeft
                d = `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${hLeft - r} A ${r} ${r} 0 0 1 ${w - r} ${hLeft} H ${r} A ${r} ${r} 0 0 1 0 ${hLeft - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
            } else {
                // Desktop: L-shaped stepped card enclosing left info and right video
                const leftEnd = infoLeft.offsetLeft + infoLeft.offsetWidth;
                const videoStart = videoRight.offsetLeft;
                const xSplit = Math.round((leftEnd + videoStart) / 2);

                d = [
                    `M ${r} 0`,
                    `H ${w - r}`,
                    `A ${r} ${r} 0 0 1 ${w} ${r}`,
                    `V ${hRight - r}`,
                    `A ${r} ${r} 0 0 1 ${w - r} ${hRight}`,
                    `H ${xSplit + r}`,
                    `A ${r} ${r} 0 0 1 ${xSplit} ${hRight - r}`,
                    `V ${hLeft + r}`,
                    `A ${r} ${r} 0 0 0 ${xSplit - r} ${hLeft}`,
                    `H ${r}`,
                    `A ${r} ${r} 0 0 1 0 ${hLeft - r}`,
                    `V ${r}`,
                    `A ${r} ${r} 0 0 1 ${r} 0`,
                    'Z'
                ].join(' ');
            }

            pathEl.setAttribute('d', d);
            if (backdrop) {
                backdrop.style.clipPath = `path('${d}')`;
            }
        }

        update();
        window.addEventListener('resize', update, { passive: true });
        window.addEventListener('load', update);

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(update);
            ro.observe(block);
            ro.observe(infoLeft);
            ro.observe(videoRight);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSteppedContactCard);
    } else {
        initSteppedContactCard();
    }
})();
