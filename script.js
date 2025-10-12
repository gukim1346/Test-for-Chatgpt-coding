const navigation = document.querySelector(".primary-navigation");
const navToggle = document.querySelector(".nav-toggle");
const yearEl = document.getElementById("year");

const setNavigationState = () => {
  const shouldOpen = window.innerWidth > 768;
  navigation?.setAttribute("data-open", shouldOpen.toString());
  navToggle?.setAttribute("aria-expanded", shouldOpen.toString());
  if (!shouldOpen) {
    navToggle?.classList.remove("is-open");
  }
};

const closeNavigation = () => {
  navigation?.setAttribute("data-open", "false");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.classList.remove("is-open");
};

navToggle?.addEventListener("click", () => {
  const isOpen = navigation?.getAttribute("data-open") === "true";
  navigation?.setAttribute("data-open", (!isOpen).toString());
  navToggle.setAttribute("aria-expanded", (!isOpen).toString());
  navToggle.classList.toggle("is-open", !isOpen);
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      closeNavigation();
    }
  });
});

window.addEventListener("resize", setNavigationState);
setNavigationState();

if (yearEl) {
  yearEl.textContent = new Date().getFullYear().toString();
}

const animatedElements = document.querySelectorAll(
  ".section, .feature-card, .pricing-card"
);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  animatedElements.forEach((el) => {
    el.classList.remove("will-animate");
    el.classList.add("is-visible");
  });
} else {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  animatedElements.forEach((el) => {
    el.classList.add("will-animate");
    observer.observe(el);
  });
}
