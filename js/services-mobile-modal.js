/**
 * Services Mobile 2x2 Grid Modal Controller
 * Opens service details in a dedicated popup tab on mobile (<= 768px).
 */
(function initServicesMobileModal() {
    const serviceData = {
        1: {
            eyebrow: "01 / Service Scope",
            title: "Platform Growth",
            image: "images/lanes/platform-growth.jpg",
            points: [
                "Content Strategy & Ideation",
                "Calendar Scheduling & Posting",
                "Organic Reach & Profile Audits",
                "Community Engagement",
                "Performance Analytics"
            ]
        },
        2: {
            eyebrow: "02 / Service Scope",
            title: "Digital Storefronts",
            image: "images/lanes/digital-storefronts.jpg",
            points: [
                "Custom Design Mockups",
                "Responsive Web Development",
                "Booking & Reservation Systems",
                "Custom Checkout Design",
                "Speed & SEO Optimization"
            ]
        },
        3: {
            eyebrow: "03 / Service Scope",
            title: "AI Cinema Lab",
            image: "images/lanes/ai-cinema.jpg",
            points: [
                "Conceptual Style Frames",
                "AI Video Generation",
                "Sound Design & Music Scoring",
                "Color Grading & Editing",
                "AI Commercials & Brand Films"
            ]
        },
        4: {
            eyebrow: "04 / Service Scope",
            title: "Full Campaigns",
            image: "images/lanes/full-campaigns.jpg",
            points: [
                "Complete Creative Production",
                "Social & Web Launch Strategy",
                "Brand Identity Guidelines",
                "Full Asset Delivery Pack",
                "Direct 1-on-1 Collaboration"
            ]
        }
    };

    function setup() {
        const backdrop = document.getElementById('serviceModalBackdrop');
        const closeBtn = document.getElementById('serviceModalClose');
        const modalEyebrow = document.getElementById('serviceModalEyebrow');
        const modalTitle = document.getElementById('serviceModalTitle');
        const modalImg = document.getElementById('serviceModalImage');
        const modalList = document.getElementById('serviceModalList');
        const modalCta = document.getElementById('serviceModalCta');
        const tabs = document.querySelectorAll('.services-mobile-tab');

        if (!backdrop || !tabs.length) return;

        function openModal(id) {
            const data = serviceData[id];
            if (!data) return;

            modalEyebrow.textContent = data.eyebrow;
            modalTitle.textContent = data.title;
            modalImg.src = data.image;
            modalImg.alt = data.title;
            modalList.innerHTML = data.points
                .map(p => `<li><span class="bullet" aria-hidden="true"></span><span>${p}</span></li>`)
                .join('');

            backdrop.classList.add('is-open');
            backdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            backdrop.classList.remove('is-open');
            backdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const id = tab.getAttribute('data-service');
                openModal(id);
            });
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const id = tab.getAttribute('data-service');
                    openModal(id);
                }
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeModal();
            });
        }

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeModal();
            }
        });

        if (modalCta) {
            modalCta.addEventListener('click', () => {
                closeModal();
            });
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
})();
