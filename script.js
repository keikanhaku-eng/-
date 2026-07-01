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

  const panels = gsap.utils.toArray(".story-panel");
  const panelWords = panels.map((panel) => {
    const label = panel.querySelector(".section-kicker");
    return (label?.textContent || panel.dataset.panel || "Story").trim();
  });
  const deviceWordFront = document.querySelector("[data-device-word-front]");
  const deviceWordBack = document.querySelector("[data-device-word-back]");
  const deviceChipFront = document.querySelector("[data-device-chip-front]");
  const deviceChipBack = document.querySelector("[data-device-chip-back]");
  const desktopQuery = window.matchMedia("(min-width: 981px)");
  const deviceFlipDuration = 0.64;
  const deviceFaceSwitchOffset = deviceFlipDuration / 2;

  const setText = (element, value) => {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  };

  const syncDeviceFace = (wordElement, chipElement, index) => {
    const clampedIndex = gsap.utils.clamp(0, panelWords.length - 1, index);
    setText(wordElement, panelWords[clampedIndex]);
    setText(chipElement, String(clampedIndex + 1).padStart(2, "0"));
  };

  const syncDeviceWords = (index, direction = 1) => {
    const activeIndex = gsap.utils.clamp(0, panelWords.length - 1, index);
    const neighborIndex = gsap.utils.clamp(
      0,
      panelWords.length - 1,
      activeIndex + (direction >= 0 ? 1 : -1)
    );

    if (activeIndex % 2 === 0) {
      syncDeviceFace(deviceWordFront, deviceChipFront, activeIndex);
      syncDeviceFace(deviceWordBack, deviceChipBack, neighborIndex);
    } else {
      syncDeviceFace(deviceWordBack, deviceChipBack, activeIndex);
      syncDeviceFace(deviceWordFront, deviceChipFront, neighborIndex);
    }
  };

  const syncDeviceWordsFromTime = (time, direction = 1) => {
    const activeIndex = gsap.utils.clamp(
      0,
      panelWords.length - 1,
      Math.floor(time - deviceFaceSwitchOffset)
    );

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
    gsap.set(panels[0], { autoAlpha: 1, yPercent: -50, y: 0, filter: "blur(0px)" });
    gsap.set("[data-device]", { rotateX: 4, rotateY: 0, rotateZ: 0 });
    syncDeviceWords(0, 1);

    const storyTimeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".story",
        start: "top top",
        end: () => `+=${panels.length * 880}`,
        scrub: 1,
        pin: ".story-pin",
        anticipatePin: 1,
        onUpdate: (self) => {
          const time = self.animation ? self.animation.time() : 0;
          syncDeviceWordsFromTime(time, self.direction || 1);
        },
      },
    });

    const deviceStates = panels.map((_, index) => ({
      rotateX: 4,
      rotateY: index * 180,
      rotateZ: 0,
      scale: 1,
    }));

    panels.forEach((panel, index) => {
      const at = index;
      const state = deviceStates[index] || deviceStates[0];
      const tags = panel.querySelectorAll(".tag-grid span");
      const cards = panel.querySelectorAll(".info-card");

      if (index > 0) {
        storyTimeline.fromTo(
          panel,
          { autoAlpha: 0, yPercent: -50, y: 70, filter: "blur(18px)" },
          { autoAlpha: 1, yPercent: -50, y: 0, filter: "blur(0px)", duration: 0.24 },
          at
        );
      }

      storyTimeline.to("[data-device]", { ...state, duration: deviceFlipDuration }, at);
      storyTimeline.to(".device-line", { scaleX: 0.55 + index * 0.08, duration: 0.48 }, at);
      storyTimeline.to(".showcase-grid", { rotateZ: index % 2 === 0 ? 0.5 : -0.5, duration: 0.48 }, at);

      if (tags.length) {
        storyTimeline.fromTo(
          tags,
          { autoAlpha: 0, y: 28, scale: 0.94 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, stagger: 0.035 },
          at + 0.12
        );
      }

      if (cards.length) {
        storyTimeline.fromTo(
          cards,
          { autoAlpha: 0, y: 34, rotateX: -10 },
          { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.3, stagger: 0.06 },
          at + 0.12
        );
      }

      if (index < panels.length - 1) {
        storyTimeline.to(
          panel,
          { autoAlpha: 0, yPercent: -50, y: -70, filter: "blur(18px)", duration: 0.24 },
          at + 0.76
        );
      }
    });

    document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href").slice(1);
        const targetIndex = panels.findIndex(
          (panel) => panel.id === targetId || panel.dataset.panel === targetId
        );

        if (targetIndex < 0 || !storyTimeline.scrollTrigger) return;

        event.preventDefault();
        const trigger = storyTimeline.scrollTrigger;
        const progress = targetIndex / Math.max(panels.length - 1, 1);
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
