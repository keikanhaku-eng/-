(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = window.gsap && window.ScrollTrigger;

  if (!hasGsap || reduceMotion) {
    root.classList.add("no-cinematic");
    return;
  }

  root.classList.add("js-enabled");

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power2.out", duration: 0.8 });

  const panelOrder = ["profile", "hobby", "career"];
  const panels = panelOrder
    .map((name) => document.querySelector(`.story-panel[data-panel="${name}"]`))
    .filter(Boolean);
  const pageSteps = panels.flatMap((panel, panelIndex) => {
    const label = panel.querySelector(".section-kicker");
    const word = (panel.dataset.word || label?.textContent || panel.dataset.panel || "Story").trim();
    const pages = gsap.utils.toArray(panel.querySelectorAll("[data-page]"));

    return pages.map((page, pageIndex) => ({
      panel,
      page,
      panelIndex,
      pageIndex,
      word: (page.dataset.word || word).trim(),
      image: page.dataset.image || `img/test${panelIndex + 1}.png`,
    }));
  });
  const deviceWordFront = document.querySelector("[data-device-word-front]");
  const deviceWordBack = document.querySelector("[data-device-word-back]");
  const deviceChipFront = document.querySelector("[data-device-chip-front]");
  const deviceChipBack = document.querySelector("[data-device-chip-back]");
  const devicePhotoFront = document.querySelector("[data-device-photo-front]");
  const devicePhotoBack = document.querySelector("[data-device-photo-back]");
  const desktopQuery = window.matchMedia("(min-width: 981px)");
  const deviceFlipDuration = 0.64;
  const deviceFaceSwitchOffset = deviceFlipDuration / 2;
  const deviceSelector = "[data-device]";
  const maxStepIndex = Math.max(pageSteps.length - 1, 0);

  const setText = (element, value) => {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  };

  const setImage = (element, value) => {
    if (!element) return;

    if (element.getAttribute("src") !== value) {
      element.dataset.failedSrc = "";
      element.hidden = false;
      element.setAttribute("src", value);
      return;
    }

    element.hidden = element.dataset.failedSrc === value || (element.complete && element.naturalWidth === 0);
  };

  [devicePhotoFront, devicePhotoBack].forEach((image) => {
    if (!image) return;
    image.addEventListener("error", () => {
      image.dataset.failedSrc = image.getAttribute("src") || "";
      image.hidden = true;
    });
  });

  const syncDeviceFace = (wordElement, chipElement, imageElement, index) => {
    const clampedIndex = gsap.utils.clamp(0, maxStepIndex, index);
    const step = pageSteps[clampedIndex];

    if (!step) return;

    setText(wordElement, step.word);
    setText(chipElement, String(step.pageIndex + 1).padStart(2, "0"));
    setImage(imageElement, step.image);
  };

  const syncDeviceWords = (index, direction = 1) => {
    const activeIndex = gsap.utils.clamp(0, maxStepIndex, index);
    const neighborIndex = gsap.utils.clamp(
      0,
      maxStepIndex,
      activeIndex + (direction >= 0 ? 1 : -1)
    );

    if (activeIndex % 2 === 0) {
      syncDeviceFace(deviceWordFront, deviceChipFront, devicePhotoFront, activeIndex);
      syncDeviceFace(deviceWordBack, deviceChipBack, devicePhotoBack, neighborIndex);
    } else {
      syncDeviceFace(deviceWordBack, deviceChipBack, devicePhotoBack, activeIndex);
      syncDeviceFace(deviceWordFront, deviceChipFront, devicePhotoFront, neighborIndex);
    }
  };

  const getActiveStepIndex = (time) => {
    const boundaryIndex = Math.floor(time);
    const boundaryStep = pageSteps[boundaryIndex];
    const previousStep = pageSteps[boundaryIndex - 1];

    if (previousStep && boundaryStep && previousStep.panel !== boundaryStep.panel) {
      return gsap.utils.clamp(0, maxStepIndex, boundaryIndex);
    }

    const activeIndex = gsap.utils.clamp(
      0,
      maxStepIndex,
      Math.floor(time - deviceFaceSwitchOffset)
    );

    return activeIndex;
  };

  const syncDeviceWordsFromTime = (time, direction = 1) => {
    const activeIndex = getActiveStepIndex(time);

    syncDeviceWords(activeIndex, direction);
  };

  gsap.from("[data-animate='header']", {
    y: -28,
    autoAlpha: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=115%",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    })
    .fromTo(
      "[data-hero-stage]",
      { rotateX: 6, rotateY: -14, z: -80, autoAlpha: 0 },
      { rotateX: 0, rotateY: 0, z: 0, autoAlpha: 1, duration: 0.36 },
      0
    )
    .to("[data-hero-copy]", { y: -90, autoAlpha: 0, filter: "blur(16px)", duration: 0.62 }, 0.38)
    .to("[data-stage-core]", { rotateY: 28, rotateX: -8, scale: 0.92, duration: 0.62 }, 0.38)
    .to("[data-layer='front']", { x: 84, y: -28, rotateY: 24, duration: 0.62 }, 0.38)
    .to("[data-layer='middle']", { x: 20, y: 12, rotateY: -4, duration: 0.62 }, 0.38)
    .to("[data-layer='back']", { x: -88, y: 50, rotateY: -28, duration: 0.62 }, 0.38);

  if (desktopQuery.matches) {
    gsap.set(panels, { autoAlpha: 0, yPercent: -50, y: 0, filter: "blur(16px)" });
    gsap.set(
      pageSteps.map((step) => step.page),
      { autoAlpha: 0, y: 26, filter: "blur(12px)" }
    );
    gsap.set(pageSteps[0]?.panel, { autoAlpha: 1, yPercent: -50, y: 0, filter: "blur(0px)" });
    gsap.set(pageSteps[0]?.page, { autoAlpha: 1, y: 0, filter: "blur(0px)" });
    gsap.set(deviceSelector, { xPercent: 0, rotateX: 4, rotateY: 0, rotateZ: 0, autoAlpha: 1 });
    syncDeviceWords(0, 1);

    const storyTimeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".story",
        start: "top top",
        end: () => `+=${pageSteps.length * 680}`,
        scrub: 1,
        pin: ".story-pin",
        anticipatePin: 1,
        onUpdate: (self) => {
          const time = self.animation ? self.animation.time() : 0;
          syncDeviceWordsFromTime(time, self.direction || 1);
        },
      },
    });

    const deviceStates = pageSteps.map((_, index) => ({
      rotateX: 4,
      rotateY: index * 180,
      rotateZ: 0,
      scale: 1,
    }));

    pageSteps.forEach((step, index) => {
      const at = index;
      const previousStep = pageSteps[index - 1];
      const state = deviceStates[index] || deviceStates[0];

      if (index > 0) {
        if (previousStep.panel !== step.panel) {
          storyTimeline.to(
            previousStep.panel,
            { autoAlpha: 0, yPercent: -50, y: -54, filter: "blur(18px)", duration: 0.22 },
            at - 0.22
          );
          storyTimeline.fromTo(
            step.panel,
            { autoAlpha: 0, yPercent: -50, y: 54, filter: "blur(18px)" },
            { autoAlpha: 1, yPercent: -50, y: 0, filter: "blur(0px)", duration: 0.24 },
            at
          );
        }

        storyTimeline.to(
          previousStep.page,
          { autoAlpha: 0, y: -28, filter: "blur(12px)", duration: 0.2 },
          at - 0.18
        );
        storyTimeline.fromTo(
          step.page,
          { autoAlpha: 0, y: 28, filter: "blur(12px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.24 },
          at
        );
      }

      if (index > 0 && previousStep.panel !== step.panel) {
        storyTimeline.to(
          deviceSelector,
          {
            xPercent: -150,
            rotateX: 4,
            rotateY: state.rotateY - 120,
            rotateZ: -8,
            scale: 0.86,
            autoAlpha: 0,
            duration: 0.34,
          },
          at - 0.34
        );
        storyTimeline.set(
          deviceSelector,
          {
            xPercent: 150,
            rotateX: 4,
            rotateY: state.rotateY - 120,
            rotateZ: 8,
            scale: 0.86,
            autoAlpha: 0,
          },
          at
        );
        storyTimeline.to(
          deviceSelector,
          {
            ...state,
            xPercent: 0,
            autoAlpha: 1,
            duration: 0.46,
          },
          at
        );
      } else {
        storyTimeline.to(
          deviceSelector,
          { ...state, xPercent: 0, autoAlpha: 1, duration: deviceFlipDuration },
          at
        );
      }
      storyTimeline.to(".device-line", { scaleX: 0.48 + (index % 3) * 0.16, duration: 0.48 }, at);
      storyTimeline.to(".showcase-grid", { rotateZ: index % 2 === 0 ? 0.5 : -0.5, duration: 0.48 }, at);
    });

    document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href").slice(1);
        const targetIndex = pageSteps.findIndex(
          (step) => step.panel.id === targetId || step.panel.dataset.panel === targetId
        );

        if (targetIndex < 0 || !storyTimeline.scrollTrigger) return;

        event.preventDefault();
        const trigger = storyTimeline.scrollTrigger;
        const progress = targetIndex / Math.max(pageSteps.length - 1, 1);
        const targetY = trigger.start + (trigger.end - trigger.start) * progress + 2;

        window.scrollTo({ top: targetY, behavior: "smooth" });
      });
    });
  } else {
    panels.forEach((panel) => {
      gsap.from(panel, {
        autoAlpha: 0,
        y: 42,
        filter: "blur(10px)",
        scrollTrigger: {
          trigger: panel,
          start: "top 78%",
          end: "top 44%",
          scrub: 1,
        },
      });
    });
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
