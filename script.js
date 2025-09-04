const nav = document.querySelector(".nav");
const navMenu = document.querySelector(".nav-items");
const btnToggleNav = document.querySelector(".menu-btn");
const workEls = document.querySelectorAll(".work-box");
const workImgs = document.querySelectorAll(".work-img");
const achCards = document.querySelectorAll(".ach-card");
const mainEl = document.querySelector("main");
const yearEl = document.querySelector(".footer-text span");

const mqDesktop = window.matchMedia("(min-width: 992px)");

const toggleNav = () => {
  // Only toggle overlay menu on mobile/tablet
  if (mqDesktop.matches) return;
  nav.classList.toggle("hidden");

  // Prevent screen from scrolling when menu is opened (mobile only)
  document.body.classList.toggle("lock-screen");

  if (nav.classList.contains("hidden")) {
    btnToggleNav.textContent = "menu";
  } else {
    // When menu is opened after transition change text respectively
    setTimeout(() => {
      btnToggleNav.textContent = "close";
    }, 475);
  }
};

btnToggleNav.addEventListener("click", toggleNav);

navMenu.addEventListener("click", (e) => {
  if (e.target.localName === "a") {
    // Always ensure body can scroll after navigation
    document.body.classList.remove("lock-screen");
    // Close overlay only on mobile
    if (!mqDesktop.matches) toggleNav();
  }
});

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !nav.classList.contains("hidden")) {
    toggleNav();
  }
});

// Animating work instances on scroll

workImgs.forEach((workImg) => workImg.classList.add("transform"));

let observer = new IntersectionObserver(
  (entries) => {
    const [entry] = entries;
    const [textbox, picture] = Array.from(entry.target.children);
    if (entry.isIntersecting) {
      picture.classList.remove("transform");
      Array.from(textbox.children).forEach(
        (el) => (el.style.animationPlayState = "running")
      );
    }
  },
  { threshold: 0.3 }
);

workEls.forEach((workEl) => {
  observer.observe(workEl);
});

// Achievements reveal on scroll
if (achCards.length) {
  const achObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
        else entry.target.classList.remove("in-view");
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  achCards.forEach((c) => achObserver.observe(c));
}

// Toggle theme and store user preferred theme for future

const switchThemeEl = document.querySelector('input[type="checkbox"]');
const storedTheme = localStorage.getItem("theme");

switchThemeEl.checked = storedTheme === "dark" || storedTheme === null;

switchThemeEl.addEventListener("click", () => {
  const isChecked = switchThemeEl.checked;

  if (!isChecked) {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
    switchThemeEl.checked = false;
  } else {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    localStorage.setItem("theme", "dark");
  }
});

// Trap the tab when menu is opened

const lastFocusedEl = document.querySelector('a[data-focused="last-focused"]');

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && document.activeElement === lastFocusedEl) {
    e.preventDefault();
    btnToggleNav.focus();
  }
});

// Rotating logos animation

const logosWrappers = document.querySelectorAll(".logo-group");

const sleep = (number) => new Promise((res) => setTimeout(res, number));

logosWrappers.forEach(async (logoWrapper, i) => {
  const logos = Array.from(logoWrapper.children);
  await sleep(1400 * i);
  setInterval(() => {
    let temp = logos[0];
    logos[0] = logos[1];
    logos[1] = logos[2];
    logos[2] = temp;
    logos[0].classList.add("hide", "to-top");
    logos[1].classList.remove("hide", "to-top", "to-bottom");
    logos[2].classList.add("hide", "to-bottom");
  }, 5600);
});

// Timeline: draw path on scroll and reveal cards

const timelineRoot = document.querySelector(".timeline");
if (timelineRoot) {
  const path = document.querySelector("#timelineMainPath");
  const items = document.querySelectorAll(".timeline-item");

  // Reveal cards when in view
  const cardsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        } else {
          // Remove when out of view so animation can replay on re-enter
          entry.target.classList.remove("in-view");
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  items.forEach((el) => cardsObserver.observe(el));

  // Initial check to ensure above-the-fold items animate
  const initialReveal = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const offset = vh * 0.1; // sync with rootMargin
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.bottom > offset && rect.top < vh - offset;
      el.classList.toggle("in-view", inView);
    });
  };
  window.addEventListener("load", initialReveal);
  window.addEventListener("resize", initialReveal);

  // Prepare SVG path for drawing
  const preparePath = () => {
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    // start hidden
    path.style.strokeDashoffset = `${length}`;
  };

  let ticking = false;
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  const updatePath = () => {
    if (!path) return;
    const length = path.getTotalLength();
    const rect = timelineRoot.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // progress from when the top hits 10% of viewport to when bottom leaves viewport
    const start = vh * 0.1;
    const end = rect.height + vh * 0.1;
    const y = vh - rect.top; // how far the top has moved into view
    const progress = clamp((y - start) / end, 0, 1);
    const offset = length * (1 - progress);
    path.style.strokeDashoffset = `${offset}`;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updatePath();
        ticking = false;
      });
      ticking = true;
    }
  });

  window.addEventListener("resize", () => {
    preparePath();
    updatePath();
  });

  // init
  preparePath();
  updatePath();
}

yearEl.textContent = new Date().getFullYear();

(function () {
  if (!nav) return;
  let lastY = window.scrollY;

  const showNav = () => {
    nav.classList.add("sticky-active");
    nav.classList.remove("sticky-hidden");
  };
  const hideNav = () => {
    nav.classList.add("sticky-hidden");
    nav.classList.remove("sticky-active");
  };

  const onScrollDir = () => {
    if (!mqDesktop.matches) return;
    const y = window.scrollY;
    const delta = y - lastY;
    // At very top, always show and clear timers
    if (y <= 4) {
      showNav();
      lastY = y;
      return;
    }
    // Threshold to avoid jitter
    const thresh = 6;
    if (delta > thresh) {
      // Scrolling down -> hide
      hideNav();
    } else if (delta < -thresh) {
      // Scrolling up -> show (and keep visible when stopping)
      showNav();
    }
    lastY = y;
  };

  const onResize = () => {
    if (mqDesktop.matches) {
      // Ensure visible on load/resize desktop
      showNav();
      // Never lock scroll on desktop
      document.body.classList.remove("lock-screen");
    } else {
      /// Remove sticky classes on mobile
      nav.classList.remove("sticky-active", "sticky-hidden");
    }
  };

  window.addEventListener("scroll", onScrollDir, { passive: true });
  window.addEventListener("resize", onResize);
  onResize();
})();

// Desktop: highlight current section's nav item (white pill)
(function () {
  const links = Array.from(document.querySelectorAll('.nav-items a'));
  if (!links.length) return;

  // Map anchors to their target elements (use header for Home '#')
  const items = links
    .map((a) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return null;
      const id = href === '#' ? null : href.slice(1);
      const el = id ? document.getElementById(id) : document.querySelector('.header');
      return el ? { a, el } : null;
    })
    .filter(Boolean);

  if (!items.length) return;

  const clearActive = () => links.forEach((l) => l.classList.remove('is-active'));
  let ratios = new Map(items.map(({ a }) => [a, 0]));

  const pickBest = () => {
    let best = null;
    let bestRatio = 0;
    ratios.forEach((r, a) => {
      if (r > bestRatio) {
        bestRatio = r;
        best = a;
      }
    });
    clearActive();
    if (mqDesktop.matches) {
      if (window.scrollY <= 4) {
        const home = links.find((l) => l.getAttribute('href') === '#');
        if (home) home.classList.add('is-active');
      } else if (best && bestRatio > 0) {
        best.classList.add('is-active');
      }
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const pair = items.find((p) => p.el === entry.target);
        if (!pair) return;
        ratios.set(pair.a, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      pickBest();
    },
    {
      // Focus on center band of viewport for "active" feel
      root: null,
      rootMargin: "-25% 0px -40% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  items.forEach(({ el }) => observer.observe(el));
  window.addEventListener('resize', pickBest);
  window.addEventListener('load', pickBest);
})();
// Inline Netlify form submission with inline thank-you
(function () {
  const forms = Array.from(document.querySelectorAll('form[name="contact"][data-netlify="true"]'));
  if (!forms.length) return;

  const encode = (fd) => new URLSearchParams(fd).toString();

  forms.forEach((form) => {
    const bodyEl = form.querySelector('.form-body');
    const successEl = form.querySelector('.form-success');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      // Ensure form-name present for Netlify
      if (!fd.get('form-name')) fd.set('form-name', form.getAttribute('name') || 'contact');
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode(fd),
        });
        if (res.ok) {
          if (bodyEl) bodyEl.hidden = true;
          if (successEl) successEl.hidden = false;
          form.reset();
        } else {
          alert('Sorry, something went wrong. Please complete the reCAPTCHA and try again.');
        }
      } catch (err) {
        alert('Network error. Please try again.');
      }
    });
  });
})();
