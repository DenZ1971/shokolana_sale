document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const mobileNav = document.querySelector(".mobile-nav");

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!isOpen));
      mobileNav.hidden = isOpen;
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        mobileNav.querySelectorAll(".language-switcher").forEach((details) => {
          details.open = false;
        });
      });
    });
  }

  const languageSwitchers = document.querySelectorAll(".language-switcher");
  languageSwitchers.forEach((switcher) => {
    switcher.addEventListener("toggle", () => {
      if (!switcher.open) return;
      languageSwitchers.forEach((other) => {
        if (other !== switcher) other.open = false;
      });
    });
  });

  document.addEventListener("click", (event) => {
    languageSwitchers.forEach((switcher) => {
      if (!switcher.contains(event.target)) switcher.open = false;
    });
  });

  const formMessages = {
    ru: { sending: "Отправка…", error: "Не удалось отправить запрос. Попробуйте ещё раз." },
    en: { sending: "Sending…", error: "The inquiry could not be sent. Please try again." },
    sk: { sending: "Odosielanie…", error: "Žiadosť sa nepodarilo odoslať. Skúste to znova." },
    sh: { sending: "Slanje…", error: "Upit nije poslan. Pokušajte ponovo." },
    sl: { sending: "Pošiljanje…", error: "Povpraševanja ni bilo mogoče poslati. Poskusite znova." }
  };

  document.querySelectorAll("form.contact-form[data-success-page]").forEach((form) => {
    const language = document.documentElement.lang.toLowerCase().split("-")[0];
    const messages = formMessages[language] || formMessages.en;
    const button = form.querySelector('button[type="submit"]');
    const originalButtonText = button ? button.textContent : "";
    const errorMessage = document.createElement("p");

    errorMessage.className = "form-submit-error";
    errorMessage.setAttribute("role", "alert");
    errorMessage.hidden = true;
    form.appendChild(errorMessage);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorMessage.hidden = true;

      if (button) {
        button.disabled = true;
        button.textContent = messages.sending;
      }

      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });

        if (!response.ok) throw new Error("Form submission failed");
        window.location.assign(new URL(form.dataset.successPage, window.location.href).href);
      } catch (error) {
        errorMessage.textContent = messages.error;
        errorMessage.hidden = false;
        if (button) {
          button.disabled = false;
          button.textContent = originalButtonText;
        }
      }
    });
  });

  const carouselLabels = {
    ru: { carousel: "Галерея продуктов", previous: "Предыдущее изображение", next: "Следующее изображение", item: "Изображение" },
    en: { carousel: "Product gallery", previous: "Previous image", next: "Next image", item: "Image" },
    sk: { carousel: "Galéria produktov", previous: "Predchádzajúci obrázok", next: "Nasledujúci obrázok", item: "Obrázok" },
    sh: { carousel: "Galerija proizvoda", previous: "Prethodna slika", next: "Sljedeća slika", item: "Slika" },
    sl: { carousel: "Galerija izdelkov", previous: "Prejšnja slika", next: "Naslednja slika", item: "Slika" }
  };

  document.querySelectorAll(".gallery-grid").forEach((track) => {
    const slides = Array.from(track.querySelectorAll(".image-card"));
    if (slides.length < 2 || track.closest(".product-carousel")) return;

    const language = document.documentElement.lang.toLowerCase().split("-")[0];
    const labels = carouselLabels[language] || carouselLabels.en;
    const carousel = document.createElement("div");
    const controls = document.createElement("div");
    const previousButton = document.createElement("button");
    const nextButton = document.createElement("button");
    const status = document.createElement("span");

    carousel.className = "product-carousel";
    controls.className = "carousel-controls";
    previousButton.className = "carousel-button carousel-previous";
    nextButton.className = "carousel-button carousel-next";
    status.className = "carousel-status";
    previousButton.type = "button";
    nextButton.type = "button";
    previousButton.setAttribute("aria-label", labels.previous);
    nextButton.setAttribute("aria-label", labels.next);
    previousButton.textContent = "←";
    nextButton.textContent = "→";
    status.setAttribute("aria-live", "polite");
    track.setAttribute("role", "region");
    track.setAttribute("aria-roledescription", "carousel");
    track.setAttribute("aria-label", labels.carousel);
    track.tabIndex = 0;

    slides.forEach((slide, index) => {
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-label", `${labels.item} ${index + 1} / ${slides.length}`);
    });

    track.parentNode.insertBefore(carousel, track);
    carousel.appendChild(track);
    controls.append(previousButton, status, nextButton);
    carousel.appendChild(controls);

    let activeIndex = 0;
    let scrollFrame = 0;

    const updateControls = () => {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      activeIndex = slides.reduce((closest, slide, index) => {
        const currentDistance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
        const closestDistance = Math.abs(slides[closest].offsetLeft - track.offsetLeft - track.scrollLeft);
        return currentDistance < closestDistance ? index : closest;
      }, 0);
      previousButton.disabled = track.scrollLeft <= 2;
      nextButton.disabled = track.scrollLeft >= maxScroll - 2;
      status.textContent = `${activeIndex + 1} / ${slides.length}`;
    };

    const move = (direction) => {
      const targetIndex = Math.max(0, Math.min(slides.length - 1, activeIndex + direction));
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.scrollTo({
        left: slides[targetIndex].offsetLeft - track.offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    };

    previousButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    });
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(updateControls);
    }, { passive: true });
    window.addEventListener("resize", updateControls);
    updateControls();
  });

  const reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((el) => observer.observe(el));
});
