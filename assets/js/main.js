document.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    window.addEventListener('load', () => {
      loadingScreen.classList.add('hidden');
      document.body.classList.add('loaded');
    });
  }

  const navbar = document.querySelector('.navbar');
  const navLinks = [...document.querySelectorAll('.navbar-nav a')];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const isCurrentPage = href === currentPage || (currentPage === 'index.html' && href === 'index.html');
    link.classList.toggle('active', isCurrentPage);
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled');
    if (currentPage === 'index.html') {
      const sections = document.querySelectorAll('section[id]');
      let current = '';
      sections.forEach(section => {
        const top = section.offsetTop - 140;
        if (window.scrollY >= top) current = section.getAttribute('id');
      });
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const isActiveSection = href === `#${current}` || (current === '' && href === '#home');
        link.classList.toggle('active', isActiveSection);
      });
    }
  });

  const toggle = document.querySelector('.navbar-toggler');
  const nav = document.querySelector('.navbar-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    navLinks.forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
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
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = 'rgba(201,162,39,.38)'; ctx.fill();
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

  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        button.textContent = 'Message Sent';
        button.disabled = true;
      }
      setTimeout(() => {
        if (button) {
          button.textContent = 'Send Message';
          button.disabled = false;
        }
        form.reset();
        alert('Thank you. We will be in touch shortly.');
      }, 1200);
    });
  }

  const galleryImages = [
    'page_01_img_1.jpeg','page_01_img_2.jpeg','page_02_img_1.jpeg','page_03_img_1.jpeg','page_04_img_1.jpeg','page_05_img_1.jpeg','page_06_img_1.jpeg','page_06_img_2.jpeg','page_07_img_1.jpeg','page_08_img_1.jpeg','page_08_img_2.jpeg','page_08_img_3.jpeg','page_09_img_1.jpeg','page_09_img_2.jpeg','page_09_img_3.jpeg','page_09_img_4.jpeg','page_10_img_1.jpeg','page_10_img_2.jpeg','page_10_img_3.jpeg','page_11_img_1.jpeg','page_11_img_2.jpeg','page_11_img_3.jpeg','page_11_img_4.jpeg','page_12_img_1.jpeg','page_12_img_2.jpeg','page_13_img_1.jpeg','page_13_img_2.jpeg','page_13_img_3.jpeg','page_13_img_4.jpeg','page_14_img_1.jpeg','page_14_img_2.jpeg','page_14_img_3.jpeg','page_15_img_1.jpeg','page_15_img_2.jpeg','page_15_img_3.jpeg','page_15_img_4.jpeg','page_16_img_1.jpeg','page_16_img_2.jpeg','page_16_img_3.jpeg','page_16_img_4.jpeg','page_17_img_1.jpeg','page_17_img_2.jpeg','page_17_img_3.jpeg','page_18_img_1.jpeg','page_18_img_2.jpeg','page_18_img_3.jpeg','page_18_img_4.jpeg','page_19_img_1.jpeg','page_19_img_2.jpeg','page_19_img_3.jpeg','page_20_img_1.jpeg','page_21_img_1.jpeg','page_21_img_2.jpeg','page_21_img_3.jpeg','page_21_img_4.jpeg','page_21_img_5.jpeg','page_22_img_1.jpeg'
  ];
  const galleryContainer = document.querySelector('#gallery-grid');
  if (galleryContainer) {
    galleryContainer.innerHTML = galleryImages.map((name) => `
      <a class="gallery-card" href="assets/images/pdf_extracted/${name}" data-glightbox="description: ${name}">
        <img src="assets/images/pdf_extracted/${name}" alt="S40 Construction project image" loading="lazy">
      </a>
    `).join('');
    if (window.GLightbox) new GLightbox({ selector: '.gallery-card' });
  }
});
