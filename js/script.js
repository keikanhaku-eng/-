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

  const intro = document.querySelector("[data-intro]");
  const introSkip = document.querySelector("[data-intro-skip]");
  const introStorageKey = "keiIntroPlayed";
  const hasSeenIntro = (() => {
    try {
      return window.sessionStorage.getItem(introStorageKey) === "1";
    } catch (error) {
      return false;
    }
  })();
  const shouldPlayIntro = Boolean(intro && !hasSeenIntro);
  let introTimeline;
  let introFinished = false;
  let pageEntrancePlayed = false;

  const rememberIntro = () => {
    try {
      window.sessionStorage.setItem(introStorageKey, "1");
    } catch (error) {
      // Storage can be unavailable in locked-down browsers; the animation still works.
    }
  };

  const pulseGlitch = () => {
    const glitchLayer = document.querySelector("[data-cyber-glitch]");

    if (!glitchLayer) return;

    glitchLayer.style.setProperty("--glitch-wide-x", "18px");
    glitchLayer.style.setProperty("--glitch-opacity", "0.78");
    glitchLayer.style.setProperty("--slice-opacity", "0.48");
    glitchLayer.style.setProperty("--noise-opacity", "0.62");
    root.style.setProperty("--glitch-canvas-x", "-8px");
    root.style.setProperty("--glitch-hue", "5deg");
    glitchLayer.classList.add("is-active");
    root.classList.add("cyber-glitching");

    window.setTimeout(() => {
      glitchLayer.classList.remove("is-active");
      root.classList.remove("cyber-glitching");
      root.style.removeProperty("--glitch-canvas-x");
      root.style.removeProperty("--glitch-hue");
      glitchLayer.style.removeProperty("--glitch-wide-x");
      glitchLayer.style.removeProperty("--glitch-opacity");
      glitchLayer.style.removeProperty("--slice-opacity");
      glitchLayer.style.removeProperty("--noise-opacity");
    }, 190);
  };

  const playPageEntrance = () => {
    if (pageEntrancePlayed) return;

    pageEntrancePlayed = true;

    if (shouldPlayIntro) {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to("[data-animate='header']", { y: 0, autoAlpha: 1, duration: 0.82 }, 0)
        .to("[data-hero-copy]", { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.9 }, 0.08)
        .to(
          "[data-hero-stage]",
          { rotateX: 0, rotateY: 0, z: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1 },
          0.22
        );
      return;
    }

    gsap.from("[data-animate='header']", {
      y: -28,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
    });
    gsap.from("[data-hero-copy]", {
      y: 30,
      autoAlpha: 0,
      filter: "blur(10px)",
      duration: 0.95,
      ease: "power3.out",
      delay: 0.08,
    });
    gsap.from("[data-hero-stage]", {
      rotateX: 7,
      rotateY: -13,
      z: -70,
      autoAlpha: 0,
      filter: "blur(12px)",
      duration: 1.05,
      ease: "power3.out",
      delay: 0.2,
    });
  };

  const finishIntro = () => {
    if (introFinished) return;

    introFinished = true;
    rememberIntro();
    root.classList.remove("intro-active");
    root.classList.add("intro-complete");

    if (intro) {
      intro.hidden = true;
      intro.setAttribute("aria-hidden", "true");
    }

    pulseGlitch();
    playPageEntrance();
    window.setTimeout(() => ScrollTrigger.refresh(), 0);
  };

  if (shouldPlayIntro) {
    root.classList.add("intro-active");
    gsap.set("[data-animate='header']", { y: -28, autoAlpha: 0 });
    gsap.set("[data-hero-copy]", { y: 30, autoAlpha: 0, filter: "blur(14px)" });
    gsap.set("[data-hero-stage]", {
      rotateX: 7,
      rotateY: -13,
      z: -80,
      autoAlpha: 0,
      filter: "blur(14px)",
    });
  } else if (intro) {
    intro.hidden = true;
    intro.setAttribute("aria-hidden", "true");
    root.classList.add("intro-complete");
  }

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

  if (shouldPlayIntro) {
    gsap.set("[data-intro-frame]", {
      autoAlpha: 0,
      scale: 0.88,
      rotateX: 10,
      filter: "blur(18px)",
    });
    gsap.set("[data-intro-title]", { autoAlpha: 0, y: 18, filter: "blur(16px)" });
    gsap.set("[data-intro-status]", { scaleX: 0.18, autoAlpha: 0.34 });
    gsap.set("[data-intro-plate='back']", {
      xPercent: -50,
      yPercent: -50,
      x: -28,
      y: 22,
      z: -170,
      rotateX: 5,
      rotateY: -18,
      autoAlpha: 0,
    });
    gsap.set("[data-intro-plate='middle']", {
      xPercent: -50,
      yPercent: -50,
      x: 10,
      y: -8,
      z: -60,
      rotateX: 3,
      rotateY: -8,
      autoAlpha: 0,
    });
    gsap.set("[data-intro-plate='front']", {
      xPercent: -50,
      yPercent: -50,
      x: 42,
      y: -34,
      z: 84,
      rotateX: 0,
      rotateY: 7,
      autoAlpha: 0,
    });

    introTimeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: finishIntro,
    });

    introTimeline
      .to("[data-intro-scan]", { scaleX: 1, autoAlpha: 1, duration: 0.44 }, 0.08)
      .to("[data-intro-scan]", { y: -170, autoAlpha: 0, duration: 0.62 }, 0.52)
      .to(
        "[data-intro-frame]",
        { autoAlpha: 1, scale: 1, rotateX: 0, filter: "blur(0px)", duration: 0.74 },
        0.2
      )
      .to("[data-intro-title]", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.78 }, 0.58)
      .to("[data-intro-status]", { scaleX: 1, autoAlpha: 0.9, duration: 0.7, stagger: 0.08 }, 0.66)
      .to("[data-intro-plate]", { autoAlpha: 1, duration: 0.58, stagger: 0.08 }, 0.96)
      .to("[data-intro-title]", { y: -14, autoAlpha: 0, filter: "blur(12px)", duration: 0.42 }, 1.62)
      .to(
        "[data-intro-plate='back']",
        { x: -138, y: 64, z: -190, rotateY: -26, autoAlpha: 0.58, duration: 0.72 },
        1.72
      )
      .to(
        "[data-intro-plate='middle']",
        { x: -12, y: 12, z: -34, rotateY: -5, autoAlpha: 0.78, duration: 0.72 },
        1.72
      )
      .to(
        "[data-intro-plate='front']",
        { x: 120, y: -56, z: 110, rotateY: 18, autoAlpha: 1, duration: 0.72 },
        1.72
      )
      .to("[data-intro-core]", { scale: 1.04, rotateX: -3, duration: 0.68 }, 1.84)
      .set("[data-intro-scan]", { y: 180, scaleX: 0, autoAlpha: 0 }, 2.32)
      .to("[data-intro-scan]", { scaleX: 1, autoAlpha: 1, duration: 0.16, ease: "power4.out" }, 2.34)
      .to("[data-intro-scan]", { y: 250, autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 2.5)
      .to("[data-intro-core]", { autoAlpha: 0, scale: 1.12, filter: "blur(18px)", duration: 0.46 }, 2.48)
      .to(intro, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" }, 2.62);
  } else {
    playPageEntrance();
  }

  if (introSkip) {
    introSkip.addEventListener("click", () => {
      if (introTimeline) {
        introTimeline.progress(1);
        return;
      }

      finishIntro();
    });
  }

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
