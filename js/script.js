(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = window.gsap && window.ScrollTrigger;
  const sceneFocusToggle = document.querySelector("[data-scene-focus-toggle]");

  if (sceneFocusToggle) {
    const setSceneFocus = (enabled) => {
      root.classList.toggle("scene-focus-mode", enabled);
      sceneFocusToggle.setAttribute("aria-pressed", String(enabled));
    };

    sceneFocusToggle.addEventListener("click", () => {
      setSceneFocus(!root.classList.contains("scene-focus-mode"));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.classList.contains("scene-focus-mode")) {
        setSceneFocus(false);
      }
    });
  }

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

  // Must be created before the story pin: ScrollTrigger refreshes triggers in
  // creation order, so the story's start/end only include the hero pin spacer
  // when this scene exists first. Call it before the intro's hidden-state sets
  // so its immediate render can't undo them.
  let heroScrollScene;
  const createHeroScrollScene = () => {
    if (heroScrollScene) return;

    heroScrollScene = gsap
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
        "[data-hero-copy]",
        { y: 0, autoAlpha: 1, filter: "blur(0px)" },
        { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.38 },
        0
      )
      .to(
        "[data-hero-copy]",
        {
          y: -90,
          autoAlpha: 0,
          filter: "blur(16px)",
          duration: 0.62,
        },
        0.38
      )
      .to("[data-stage-core]", { rotateY: 28, rotateX: -8, scale: 0.92, duration: 0.62 }, 0.38)
      .to("[data-layer='front']", { x: 84, y: -28, rotateY: 24, duration: 0.62 }, 0.38)
      .to("[data-layer='middle']", { x: 20, y: 12, rotateY: -4, duration: 0.62 }, 0.38)
      .to("[data-layer='back']", { x: -88, y: 50, rotateY: -28, duration: 0.62 }, 0.38);
  };

  // Opacity or filter on [data-hero-stage] would make it a backdrop root and
  // cut the plates' liquid-glass refraction off until the tween ends, so the
  // refraction popped in (visibly darker) one frame after the entrance. The
  // stage therefore only animates transforms; the fade runs on the individual
  // pieces, whose own opacity dims the refracted backdrop along with them.
  // Plates keep per-element CSS opacity (.plate-back is 0.55), so record the
  // natural values to fade back to instead of assuming 1.
  const stageFadeTargets = gsap.utils.toArray(
    "[data-hero-stage] .precision-frame, [data-hero-stage] .glass-plate"
  );
  const stageFadeAlpha = new Map(
    stageFadeTargets.map((el) => [el, Number(gsap.getProperty(el, "opacity"))])
  );
  const fadeInStagePieces = (timeline, at) => {
    stageFadeTargets.forEach((el, index) => {
      timeline.fromTo(
        el,
        { autoAlpha: 0 },
        {
          autoAlpha: stageFadeAlpha.get(el),
          duration: 0.85,
          immediateRender: true,
          clearProps: "opacity,visibility",
        },
        at + index * 0.09
      );
    });
  };

  const playPageEntrance = () => {
    if (pageEntrancePlayed) return;

    pageEntrancePlayed = true;

    if (shouldPlayIntro) {
      const entrance = gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          "[data-animate='header']",
          { y: -28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.82 },
          0
        )
        .fromTo(
          "[data-hero-copy]",
          { y: 30, autoAlpha: 0, filter: "blur(14px)" },
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.9, immediateRender: true },
          0.08
        )
        .fromTo(
          "[data-hero-stage]",
          { rotateX: 7, rotateY: -13, z: -80 },
          { rotateX: 0, rotateY: 0, z: 0, duration: 1, immediateRender: true },
          0.22
        );

      fadeInStagePieces(entrance, 0.3);
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
      duration: 1.05,
      ease: "power3.out",
      delay: 0.2,
    });
    fadeInStagePieces(gsap.timeline({ defaults: { ease: "power3.out" } }), 0.26);
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

  createHeroScrollScene();

  if (shouldPlayIntro) {
    root.classList.add("intro-active");
    gsap.set("[data-animate='header']", { y: -28, autoAlpha: 0 });
    gsap.set("[data-hero-copy]", { y: 30, autoAlpha: 0, filter: "blur(14px)" });
    gsap.set("[data-hero-stage]", { rotateX: 7, rotateY: -13, z: -80 });
    gsap.set(stageFadeTargets, { autoAlpha: 0 });
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

  // Decode every step image up front so the face swap never waits on a network
  // load mid-flip.
  const preloadedImages = new Set();
  pageSteps.forEach((step) => {
    if (!step.image || preloadedImages.has(step.image)) return;
    preloadedImages.add(step.image);
    const img = new Image();
    img.src = step.image;
  });

  if (shouldPlayIntro) {
    const introChars = gsap.utils.toArray("[data-intro-char]");

    gsap.set("[data-intro-veil]", { opacity: 1 });
    gsap.set("[data-intro-kicker]", { autoAlpha: 0, y: 14 });
    gsap.set(introChars, { autoAlpha: 0 });
    gsap.set("[data-intro-name]", { filter: "blur(0px) brightness(1)" });
    gsap.set("[data-intro-rule]", { scaleX: 0, autoAlpha: 0 });
    gsap.set("[data-intro-sub]", { autoAlpha: 0, y: 12 });

    introTimeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: finishIntro,
    });

    // Neon-tube strike: hard opacity steps, then lock on.
    const igniteChar = (target, at) => {
      introTimeline
        .set(target, { autoAlpha: 0.45 }, at)
        .set(target, { autoAlpha: 0.06 }, at + 0.055)
        .set(target, { autoAlpha: 0.75 }, at + 0.12)
        .set(target, { autoAlpha: 0.16 }, at + 0.175)
        .to(target, { autoAlpha: 1, duration: 0.14, ease: "power2.out" }, at + 0.23);
    };

    introTimeline.to("[data-intro-kicker]", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.15);

    igniteChar(introChars[0], 0.5);
    igniteChar(introChars[1], 0.82);
    igniteChar(introChars[2], 1.14);

    introTimeline
      .to("[data-intro-rule]", { scaleX: 1, autoAlpha: 1, duration: 0.55, ease: "power2.inOut" }, 1.52)
      .to("[data-intro-sub]", { autoAlpha: 1, y: 0, duration: 0.5 }, 1.68)
      // The reveal beat: a real lightning strike in the WebGL scene while the veil drops.
      .call(() => window.dispatchEvent(new CustomEvent("kei:lightning")), null, 2.05)
      .to("[data-intro-name]", { filter: "blur(0px) brightness(1.85)", duration: 0.09, ease: "power4.out" }, 2.05)
      .to("[data-intro-name]", { filter: "blur(0px) brightness(1)", duration: 0.55, ease: "power2.out" }, 2.15)
      .to("[data-intro-veil]", { opacity: 0.38, duration: 0.14, ease: "power4.out" }, 2.05)
      .to("[data-intro-veil]", { opacity: 0.56, duration: 0.6, ease: "power2.inOut" }, 2.24)
      // Handoff: the street stays, the title steps aside for the hero.
      .to("[data-intro-kicker], [data-intro-sub]", { autoAlpha: 0, y: -10, duration: 0.4 }, 2.9)
      .to("[data-intro-rule]", { scaleX: 0.18, autoAlpha: 0, duration: 0.4 }, 2.9)
      .to(
        "[data-intro-name]",
        { y: -34, autoAlpha: 0, filter: "blur(9px) brightness(1.1)", duration: 0.55, ease: "power2.in" },
        3.0
      )
      .to("[data-intro-veil]", { opacity: 0, duration: 0.75, ease: "power2.inOut" }, 3.0)
      .call(playPageEntrance, null, 3.08)
      .to(intro, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" }, 3.4);
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

    // Sync the device faces from the timeline's own onUpdate, not the
    // ScrollTrigger's: with scrub smoothing the animation keeps playing after
    // the last scroll event, and only this callback fires on those catch-up
    // frames — otherwise the face swap misses the flip midpoint.
    let lastStoryTime = 0;
    let lastStoryDirection = 1;

    const storyTimeline = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate() {
        const time = this.time();

        if (time !== lastStoryTime) {
          lastStoryDirection = time > lastStoryTime ? 1 : -1;
          lastStoryTime = time;
        }

        syncDeviceWordsFromTime(time, lastStoryDirection);
      },
      scrollTrigger: {
        trigger: ".story",
        start: "top top",
        end: () => `+=${pageSteps.length * 680}`,
        scrub: 1,
        pin: ".story-pin",
        anticipatePin: 1,
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
