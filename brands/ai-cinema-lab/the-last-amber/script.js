/* ============================================================
   THE LAST EMBER — JavaScript
   Scroll reveals, click-to-play video, nav scroll state
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. NAV — scroll state, fade-in past hero, & hamburger overlay menu
     ============================================================ */
  const nav = document.getElementById('nav');
  const hero = document.getElementById('hero');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navMenuLinks = document.querySelectorAll('.nav-dropdown-link');

  if (nav && hero) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      nav.classList.toggle('nav-visible', !entry.isIntersecting);
    }, { threshold: 0 });
    heroObserver.observe(hero);
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.borderBottomColor = 'rgba(212,165,116,0.08)';
    } else {
      nav.style.borderBottomColor = 'rgba(212,165,116,0.12)';
    }
  }, { passive: true });

  const closeMenu = () => {
    if (navMenu) {
      navMenu.classList.remove('active');
    }
    if (navToggle) {
      navToggle.classList.remove('active');
    }
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = navMenu.classList.toggle('active');
      navToggle.classList.toggle('active', isActive);
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target)) {
        closeMenu();
      }
    });
  }

  navMenuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* ============================================================
     2. SMOOTH NAV LINKS — offset for fixed nav
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 60;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  /* ============================================================
     3. VOICEOVER BUTTONS — click to play/stop individual VO clips
     ============================================================ */
  const voButtons = document.querySelectorAll('.vo-play-btn');
  let currentVO = null;

  voButtons.forEach(btn => {
    const audio = btn.nextElementSibling; // the <audio> tag right after the button
    if (!audio) return;

    btn.addEventListener('click', e => {
      e.stopPropagation(); // don't trigger shot card click

      if (currentVO && currentVO !== audio) {
        currentVO.pause();
        currentVO.currentTime = 0;
        const prevBtn = currentVO.previousElementSibling;
        if (prevBtn) {
          prevBtn.classList.remove('playing');
          prevBtn.innerHTML = '&#9654; VO';
        }
        currentVO = null;
      }

      if (audio.paused) {
        audio.play().catch(() => {});
        btn.classList.add('playing');
        btn.innerHTML = '&#9646;&#9646; VO';
        currentVO = audio;
      } else {
        audio.pause();
        audio.currentTime = 0;
        btn.classList.remove('playing');
        btn.innerHTML = '&#9654; VO';
        currentVO = null;
      }
    });

    audio.addEventListener('ended', () => {
      btn.classList.remove('playing');
      btn.innerHTML = '&#9654; VO';
      currentVO = null;
    });
  });


  /* ============================================================
     4. SCROLL REVEAL — IntersectionObserver
     ============================================================ */
  const revealEls = document.querySelectorAll('.reveal');


  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings slightly
        const siblings = entry.target.parentElement
          ? Array.from(entry.target.parentElement.children).filter(c => c.classList.contains('reveal'))
          : [];
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 70, 280);

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ============================================================
     4. SHOT CARDS — click-to-play video
     ============================================================ */
  const shotMediaEls = document.querySelectorAll('.shot-media');
  let currentlyPlaying = null;

  shotMediaEls.forEach(mediaEl => {
    const video = mediaEl.querySelector('.shot-video');
    const img   = mediaEl.querySelector('.shot-img');

    if (!video) return;

    mediaEl.addEventListener('click', () => {
      const isPlaying = mediaEl.classList.contains('playing');

      // Pause any currently playing video
      if (currentlyPlaying && currentlyPlaying !== mediaEl) {
        const prevVideo = currentlyPlaying.querySelector('.shot-video');
        if (prevVideo) {
          prevVideo.pause();
          prevVideo.currentTime = 0;
        }
        currentlyPlaying.classList.remove('playing');
        currentlyPlaying = null;
      }

      if (isPlaying) {
        // Pause this video
        video.pause();
        mediaEl.classList.remove('playing');
        currentlyPlaying = null;
      } else {
        // Play this video
        video.play().catch(() => {});
        mediaEl.classList.add('playing');
        currentlyPlaying = mediaEl;
      }
    });

    // When video ends, revert to still image
    video.addEventListener('ended', () => {
      mediaEl.classList.remove('playing');
      currentlyPlaying = null;
    });
  });

  /* ============================================================
     5. HERO SCROLL PARALLAX — subtle only
     ============================================================ */
  const heroPosterImg = document.querySelector('.hero-poster-img');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled > window.innerHeight) return;
    if (!heroPosterImg) return;
    const speed = scrolled * 0.12;
    heroPosterImg.style.transform = `scale(1.05) translateY(${speed}px)`;
  }, { passive: true });

  /* ============================================================
     6. SCORE CARDS — stagger entrance with counter animation
     ============================================================ */
  const scoreCards = document.querySelectorAll('.score-card');
  let scoresAnimated = false;

  const scoreObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !scoresAnimated) {
        scoresAnimated = true;
        scoreCards.forEach((card, i) => {
          const numEl = card.querySelector('.score-num');
          if (!numEl) return;
          setTimeout(() => {
            animateCounter(numEl, 0, 10, 600);
          }, i * 80);
        });
        scoreObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });

  if (scoreCards.length) scoreObserver.observe(scoreCards[0]);

  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     7. SCENE BLOCK — subtle color-shift indicator in nav area
     ============================================================ */
  const sceneBlocks = document.querySelectorAll('.scene-block');

  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Could be extended to highlight nav items
        entry.target.style.opacity = '1';
      }
    });
  }, { threshold: 0.1 });

  sceneBlocks.forEach(b => sceneObserver.observe(b));

  /* ============================================================
     8. CURSOR EMBER TRAIL — very subtle amber particles
     ============================================================ */
  const canvas = document.createElement('canvas');
  canvas.id = 'ember-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '0.6'
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = [];
  let mouseX = -100, mouseY = -100;
  let isMoving = false;
  let moveTimer;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMoving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => { isMoving = false; }, 100);

    // Spawn particles only occasionally for subtlety
    if (Math.random() > 0.55) return;
    particles.push({
      x: mouseX + (Math.random() - 0.5) * 6,
      y: mouseY + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 1.2 + 0.4),
      life: 1,
      size: Math.random() * 2.5 + 0.8,
      hue: 30 + Math.random() * 20
    });
  }, { passive: true });

  function drawEmbers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy -= 0.02; // drift upward
      p.life -= 0.028;

      if (p.life <= 0) { particles.splice(i, 1); continue; }

      const alpha = p.life * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${p.hue}, 85%, 65%)`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(drawEmbers);
  }

  drawEmbers();

  /* ============================================================
     9. LIGHTING ARC — animate on scroll into view
     ============================================================ */
  const arcBar = document.querySelector('.arc-bar');
  if (arcBar) {
    arcBar.querySelectorAll('.arc-seg').forEach(seg => {
      seg.style.opacity = '0';
      seg.style.transform = 'scaleX(0.3)';
      seg.style.transformOrigin = 'left';
      seg.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });

    const arcObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          arcBar.querySelectorAll('.arc-seg').forEach((seg, i) => {
            setTimeout(() => {
              seg.style.opacity = '1';
              seg.style.transform = 'scaleX(1)';
            }, i * 150);
          });
          arcObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });

    arcObserver.observe(arcBar);
  }

});
