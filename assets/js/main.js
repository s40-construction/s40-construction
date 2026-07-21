const firebaseConfig = {
  apiKey: "AIzaSyCUl7lkRpD4EvOt7MXf-M1H2yvnezlYi2U",
  authDomain: "markkeneth-b741d.firebaseapp.com",
  databaseURL: "https://markkeneth-b741d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "markkeneth-b741d",
  storageBucket: "markkeneth-b741d.firebasestorage.app",
  messagingSenderId: "1052351561410",
  appId: "1:1052351561410:web:c471dcd2aa88a39027455b"
};

const isFirebaseConfigured = () => {
  const hasValue = value => typeof value === 'string' && value && !value.includes('YOUR_');
  return hasValue(firebaseConfig.apiKey) && hasValue(firebaseConfig.databaseURL) && hasValue(firebaseConfig.projectId);
};

let firebaseDatabase = null;
let firebaseReady = false;

const initFirebase = () => {
  if (!isFirebaseConfigured() || firebaseReady || !window.firebase) return false;
  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    firebaseDatabase = window.firebase.database();
    firebaseReady = true;
    return true;
  } catch (error) {
    console.warn('Firebase initialization skipped', error);
    return false;
  }
};

const getStoredMessages = () => {
  try {
    return JSON.parse(localStorage.getItem('s40-client-messages') || '[]');
  } catch (error) {
    return [];
  }
};

const saveStoredMessages = (messages) => {
  localStorage.setItem('s40-client-messages', JSON.stringify(messages));
  window.dispatchEvent(new CustomEvent('s40:messages-updated', { detail: messages[0] || null }));
};

const saveMessageToSharedInbox = async (payload) => {
  const existing = getStoredMessages();
  existing.unshift(payload);
  saveStoredMessages(existing);

  if (initFirebase()) {
    try {
      const ref = await firebaseDatabase.ref('messages').push(payload);
      // Update the message in localStorage with the Firebase key
      payload.fbKey = ref.key;
      const updated = getStoredMessages();
      const index = updated.findIndex(m => m.id === payload.id);
      if (index >= 0) {
        updated[index].fbKey = ref.key;
        saveStoredMessages(updated);
      }
    } catch (error) {
      console.warn('Unable to sync message to Firebase', error);
    }
  }
};

const loadMessagesFromSharedInbox = async (callback) => {
  const localMessages = getStoredMessages();
  if (callback) callback(localMessages);

  if (!initFirebase()) return;

  try {
    const snapshot = await firebaseDatabase.ref('messages').orderByChild('sentAt').once('value');
    const remoteMessages = [];
    snapshot.forEach(child => {
      remoteMessages.push({ id: child.key, fbKey: child.key, ...child.val() });
    });
    remoteMessages.sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));

    if (remoteMessages.length) {
      saveStoredMessages(remoteMessages);
      if (callback) callback(remoteMessages);
    }
  } catch (error) {
    console.warn('Unable to load messages from Firebase', error);
  }
};

window.saveMessageToSharedInbox = saveMessageToSharedInbox;
window.loadMessagesFromSharedInbox = loadMessagesFromSharedInbox;
window.initFirebase = initFirebase;
window.getFirebaseDatabase = () => firebaseDatabase;

const showFloatingNotice = (message, timeout = 3000) => {
  let notice = document.querySelector('.contact-success-notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'contact-success-notice';
    document.body.insertBefore(notice, document.body.firstChild);
  }

  notice.innerHTML = `<i class="fa-solid fa-check-circle" style="margin-right: .6rem;"></i>${message}`;
  notice.classList.remove('show');
  requestAnimationFrame(() => notice.classList.add('show'));

  window.clearTimeout(window.contactNoticeTimeout);
  window.contactNoticeTimeout = window.setTimeout(() => {
    notice.classList.remove('show');
    window.setTimeout(() => {
      notice.remove();
    }, 250);
  }, timeout);
};

const setPendingNotice = (message) => {
  try {
    sessionStorage.setItem('s40-contact-success', message);
  } catch (error) {
    console.warn('Unable to store notice', error);
  }
};

const consumePendingNotice = () => {
  try {
    const message = sessionStorage.getItem('s40-contact-success');
    sessionStorage.removeItem('s40-contact-success');
    return message || '';
  } catch (error) {
    console.warn('Unable to read notice', error);
    return '';
  }
};

window.addEventListener('DOMContentLoaded', () => {
  if (window.GLightbox && document.querySelector('.water-lightbox')) {
    new GLightbox({
      selector: '.water-lightbox',
      touchNavigation: true,
      loop: true,
      closeButton: true,
      openEffect: 'zoom',
      closeEffect: 'fade',
      slideEffect: 'slide'
    });
  }

  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    window.addEventListener('load', () => {
      loadingScreen.classList.add('hidden');
      document.body.classList.add('loaded');
    });
  }

  const navbar = document.querySelector('.navbar');
  const navLinks = [...document.querySelectorAll('.navbar-nav a')];
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').replace(/\/$/, '');

  const normalizePage = (value) => {
    if (!value || value === '/' || value === 'index.html') return 'index.html';
    return value.replace(/\/$/, '').split('?')[0].split('#')[0];
  };

  const setActiveNav = () => {
    const normalizedCurrent = normalizePage(currentPage);
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const normalizedHref = normalizePage(href);
      link.classList.toggle('active', normalizedHref === normalizedCurrent);
    });
  };

  const closeMenu = () => {
    const toggle = document.querySelector('.navbar-toggler');
    const nav = document.querySelector('.navbar-nav');
    nav?.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) {
      const icon = toggle.querySelector('i');
      icon?.classList.remove('fa-xmark');
      icon?.classList.add('fa-bars');
    }
  };

  const openMenu = () => {
    const toggle = document.querySelector('.navbar-toggler');
    const nav = document.querySelector('.navbar-nav');
    nav?.classList.add('open');
    document.body.classList.add('menu-open');
    toggle?.setAttribute('aria-expanded', 'true');
    if (toggle) {
      const icon = toggle.querySelector('i');
      icon?.classList.remove('fa-bars');
      icon?.classList.add('fa-xmark');
    }
  };

  setActiveNav();

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar?.classList.add('scrolled'); else navbar?.classList.remove('scrolled');
  });

  const toggle = document.querySelector('.navbar-toggler');
  const nav = document.querySelector('.navbar-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      nav.classList.contains('open') ? closeMenu() : openMenu();
    });

    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href') || '';
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
          closeMenu();
          return;
        }
        e.preventDefault();
        document.body.classList.add('page-transitioning');
        closeMenu();
        setTimeout(() => {
          window.location.href = href;
        }, 180);
      });
    });

    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) closeMenu();
    });
  }

  document.body.classList.add('page-ready');

  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    const tryPlayHeroVideo = () => {
      const playAttempt = heroVideo.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {
          // Some browsers block autoplay until the first user interaction.
        });
      }
    };

    heroVideo.muted = true;
    heroVideo.autoplay = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.setAttribute('autoplay', '');
    heroVideo.setAttribute('loop', '');
    heroVideo.setAttribute('playsinline', '');

    tryPlayHeroVideo();
    heroVideo.addEventListener('canplay', tryPlayHeroVideo);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlayHeroVideo();
    });

    const unlockAutoplay = () => {
      tryPlayHeroVideo();
      window.removeEventListener('pointerdown', unlockAutoplay);
      window.removeEventListener('touchstart', unlockAutoplay);
      window.removeEventListener('keydown', unlockAutoplay);
    };

    window.addEventListener('pointerdown', unlockAutoplay, { once: true });
    window.addEventListener('touchstart', unlockAutoplay, { once: true });
    window.addEventListener('keydown', unlockAutoplay, { once: true });
  }

  const pendingNotice = consumePendingNotice();
  if (pendingNotice) {
    showFloatingNotice(pendingNotice);
  }

  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.1 });
  revealElements.forEach(el => observer.observe(el));

  if (window.AOS) AOS.init({ duration: 900, once: true, offset: 80, easing: 'ease-out-cubic' });

  const counters = document.querySelectorAll('[data-count]');
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-count');
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.floor(progress * target);
      counter.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  const heroCanvas = document.querySelector('#hero-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let width = heroCanvas.offsetWidth, height = heroCanvas.offsetHeight;
    heroCanvas.width = width; heroCanvas.height = height;
    const particles = Array.from({ length: 60 }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 2 + 1 }));
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,117,31,.38)'; ctx.fill();
      });
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', () => { width = heroCanvas.offsetWidth; height = heroCanvas.offsetHeight; heroCanvas.width = width; heroCanvas.height = height; });
  }

  const cursorDot = document.querySelector('.cursor-dot');
  const cursorOutline = document.querySelector('.cursor-outline');
  if (cursorDot && cursorOutline) {
    document.body.classList.add('cursor-enabled');
    window.addEventListener('mousemove', e => {
      cursorDot.style.left = `${e.clientX}px`; cursorDot.style.top = `${e.clientY}px`;
      cursorOutline.style.left = `${e.clientX}px`; cursorOutline.style.top = `${e.clientY}px`;
    });
    document.querySelectorAll('a, button, .project-card, .gallery-card, .service-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.3)');
      el.addEventListener('mouseleave', () => cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)');
    });
  }

  // Check for form submission success
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    showFloatingNotice('Thank you for reaching out! We\'ve received your message and will reply shortly.', 5000);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const fields = {
        name: form.querySelector('[name="name"]'),
        email: form.querySelector('[name="email"]'),
        phone: form.querySelector('[name="phone"]'),
        subject: form.querySelector('[name="subject"]'),
        message: form.querySelector('[name="message"]')
      };

      const payload = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: fields.name?.value.trim() || 'Client',
        email: fields.email?.value.trim() || '',
        phone: fields.phone?.value.trim() || '',
        subject: fields.subject?.value.trim() || 'New inquiry',
        message: fields.message?.value.trim() || '',
        sentAt: new Date().toISOString()
      };

      if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
      }

      try {
        // Save message (handles both localStorage and Firebase with key capture)
        await saveMessageToSharedInbox(payload);

        showFloatingNotice('Thank you for reaching out. Please wait for our reply through email or phone call.', 5000);
        form.reset();
        if (button) {
          button.textContent = 'Message Sent';
          setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Send Message';
          }, 3000);
        }
      } catch (error) {
        console.error('Unable to save message', error);
        if (button) {
          button.disabled = false;
          button.textContent = 'Send Message';
        }
        showFloatingNotice('Something went wrong. Please try again or contact us directly.', 4000);
      }
    });
  }

  const galleryImages = [
    'assets/images/e8d0b20b-3735-4614-9d9f-8603090f4011.jpg',
    'assets/images/pdf_extracted/page_01_img_1.jpeg','assets/images/pdf_extracted/page_01_img_2.jpeg','assets/images/pdf_extracted/page_03_img_1.jpeg','assets/images/pdf_extracted/page_04_img_1.jpeg','assets/images/pdf_extracted/page_05_img_1.jpeg','assets/images/pdf_extracted/page_06_img_1.jpeg','assets/images/pdf_extracted/page_07_img_1.jpeg','assets/images/pdf_extracted/page_08_img_2.jpeg','assets/images/pdf_extracted/page_08_img_3.jpeg','assets/images/pdf_extracted/page_09_img_2.jpeg','assets/images/pdf_extracted/page_09_img_3.jpeg','assets/images/pdf_extracted/page_09_img_4.jpeg','assets/images/pdf_extracted/page_10_img_2.jpeg','assets/images/pdf_extracted/page_10_img_3.jpeg','assets/images/pdf_extracted/page_11_img_2.jpeg','assets/images/pdf_extracted/page_11_img_3.jpeg','assets/images/pdf_extracted/page_11_img_4.jpeg','assets/images/pdf_extracted/page_12_img_2.jpeg','assets/images/pdf_extracted/page_13_img_2.jpeg','assets/images/pdf_extracted/page_13_img_3.jpeg','assets/images/pdf_extracted/page_13_img_4.jpeg','assets/images/pdf_extracted/page_14_img_2.jpeg','assets/images/pdf_extracted/page_14_img_3.jpeg','assets/images/pdf_extracted/page_15_img_2.jpeg','assets/images/pdf_extracted/page_15_img_3.jpeg','assets/images/pdf_extracted/page_15_img_4.jpeg','assets/images/pdf_extracted/page_16_img_2.jpeg','assets/images/pdf_extracted/page_16_img_3.jpeg','assets/images/pdf_extracted/page_16_img_4.jpeg','assets/images/pdf_extracted/page_17_img_2.jpeg','assets/images/pdf_extracted/page_17_img_3.jpeg','assets/images/pdf_extracted/page_18_img_2.jpeg','assets/images/pdf_extracted/page_18_img_3.jpeg','assets/images/pdf_extracted/page_18_img_4.jpeg','assets/images/pdf_extracted/page_19_img_2.jpeg','assets/images/pdf_extracted/page_19_img_3.jpeg','assets/images/pdf_extracted/page_20_img_1.jpeg','assets/images/pdf_extracted/page_21_img_3.jpeg'
  ];
  const galleryContainer = document.querySelector('#gallery-grid');
  if (galleryContainer) {
    galleryContainer.innerHTML = galleryImages.map((src) => `
      <a class="gallery-card" href="${src}" data-glightbox="type:image">
        <img src="${src}" alt="S40 Construction project image" loading="lazy">
      </a>
    `).join('');

    galleryContainer.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => {
        const card = img.closest('.gallery-card');
        if (card) card.remove();
      }, { once: true });
    });

    galleryImages.slice(0, 8).forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    if (window.GLightbox) {
      new GLightbox({
        selector: '.gallery-card',
        touchNavigation: true,
        loop: true,
        closeButton: true,
        preload: true,
        openEffect: 'zoom',
        closeEffect: 'fade',
        slideEffect: 'fade'
      });
    }
  }
});

