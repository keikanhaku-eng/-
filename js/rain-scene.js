(() => {
  const container = document.querySelector("[data-rain-scene]");
  const THREE = window.THREE;

  if (!container || !THREE) {
    document.documentElement.classList.add("no-rain-webgl");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompact = window.matchMedia("(max-width: 760px)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (error) {
    document.documentElement.classList.add("no-rain-webgl");
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#030606");
  scene.fog = new THREE.FogExp2("#061012", 0.025);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 90);
  camera.position.set(0.4, 2.32, 8.6);

  renderer.setClearColor("#030606", 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.appendChild(renderer.domElement);
  const backgroundSystem = container.closest(".background-system");
  if (backgroundSystem) {
    backgroundSystem.classList.add("rain-scene-ready");
  }
  const glitchLayer = document.querySelector("[data-cyber-glitch]");
  const glitchSlices = glitchLayer ? Array.from(glitchLayer.querySelectorAll("span")) : [];
  const glitchCanvas = glitchLayer ? document.createElement("canvas") : null;
  const glitchContext = glitchCanvas ? glitchCanvas.getContext("2d", { alpha: true }) : null;
  if (glitchCanvas) {
    glitchCanvas.className = "glitch-noise";
    glitchLayer.appendChild(glitchCanvas);
  }

  const clock = new THREE.Clock();
  const lookTarget = new THREE.Vector3(2.4, 0.35, -15.8);
  const dynamicLookTarget = lookTarget.clone();
  const baseCameraPosition = new THREE.Vector3(0.4, 1.82, 8.6);
  const cameraCurrentPosition = baseCameraPosition.clone();
  const cameraTargetPosition = baseCameraPosition.clone();
  const cameraCurrentLookTarget = lookTarget.clone();
  const cameraTargetLookTarget = lookTarget.clone();
  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerCurrent = new THREE.Vector2(0, 0);
  const lightningShakeOffset = new THREE.Vector3(0, 0, 0);
  const storyElement = document.querySelector(".story");
  const storyPanelOrder = ["profile", "hobby", "career"];
  const storyPanels = storyPanelOrder
    .map((name) => document.querySelector(`.story-panel[data-panel="${name}"]`))
    .filter(Boolean);
  const storyPanelCount = Math.max(1, storyPanels.length);
  const storyPageCount = Math.max(
    storyPanelCount,
    storyPanels.reduce((total, panel) => total + panel.querySelectorAll("[data-page]").length, 0)
  );
  const scrollCameraViews = [
    {
      position: new THREE.Vector3(0.15, 4.45, 7.3),
      target: new THREE.Vector3(2.4, -0.45, -16.2),
    },
    {
      position: new THREE.Vector3(-4.2, 3.0, 7.2),
      target: new THREE.Vector3(1.8, 0.25, -16.1),
    },
    {
      position: new THREE.Vector3(5.6, 2.95, 9.25),
      target: new THREE.Vector3(3.0, 0.12, -16.55),
    },
  ];
  const bgTarget = new THREE.WebGLRenderTarget(2, 2, {
    depthBuffer: true,
    stencilBuffer: false,
  });

  const textureLoader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const loadRepeatingTexture = (path, repeatX, repeatY, colorTexture = false) => {
    const texture = textureLoader.load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = Math.min(maxAnisotropy, 8);
    if (colorTexture && "colorSpace" in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    return texture;
  };

  const wallRepeatX = 4.8;
  const wallRepeatY = 2.35;
  const brickWallMap = loadRepeatingTexture(
    "floortx/Terracotta_Floor_Tiles_005_basecolor.png",
    wallRepeatX,
    wallRepeatY,
    true
  );
  const brickWallNormal = loadRepeatingTexture(
    "floortx/Terracotta_Floor_Tiles_005_normal.png",
    wallRepeatX,
    wallRepeatY
  );
  const brickWallRoughness = loadRepeatingTexture(
    "floortx/Terracotta_Floor_Tiles_005_roughness.png",
    wallRepeatX,
    wallRepeatY
  );
  const brickWallAo = loadRepeatingTexture(
    "floortx/Terracotta_Floor_Tiles_005_ambientOcclusion.png",
    wallRepeatX,
    wallRepeatY
  );
  const brickWallHeight = loadRepeatingTexture(
    "floortx/Terracotta_Floor_Tiles_005_height.png",
    wallRepeatX,
    wallRepeatY
  );

  const groundRepeatX = 7;
  const groundRepeatY = 12.4;
  const asphaltBaseMap = loadRepeatingTexture(
    "asphalt%20texture/Asphalt_001_COLOR.png",
    groundRepeatX,
    groundRepeatY,
    true
  );
  const asphaltNormalMap = loadRepeatingTexture(
    "asphalt%20texture/Asphalt_001_NRM.png",
    groundRepeatX,
    groundRepeatY
  );
  const asphaltAoMap = loadRepeatingTexture(
    "asphalt%20texture/Asphalt_001_OCC.png",
    groundRepeatX,
    groundRepeatY
  );
  const asphaltBumpMap = loadRepeatingTexture(
    "asphalt%20texture/Asphalt_001_DISP.png",
    groundRepeatX,
    groundRepeatY
  );
  const asphaltSpecMap = loadRepeatingTexture(
    "asphalt%20texture/Asphalt_001_SPEC.png",
    groundRepeatX,
    groundRepeatY
  );
  const rainGroundNormal = loadRepeatingTexture(
    "raintx/Water_Droplets_001_normal.jpg",
    groundRepeatX * 1.18,
    groundRepeatY * 1.18
  );
  const rainGroundRoughness = loadRepeatingTexture(
    "raintx/Water_Droplets_001_roughness.jpg",
    groundRepeatX * 1.18,
    groundRepeatY * 1.18
  );

  const enableAoMap = (mesh) => {
    if (mesh.geometry.attributes.uv && !mesh.geometry.attributes.uv2) {
      mesh.geometry.setAttribute("uv2", mesh.geometry.attributes.uv.clone());
    }
  };

  const groundMaterial = new THREE.MeshPhysicalMaterial({
    color: "#101514",
    map: asphaltBaseMap,
    normalMap: asphaltNormalMap,
    normalScale: new THREE.Vector2(0.72, 0.72),
    aoMap: asphaltAoMap,
    aoMapIntensity: 0.78,
    bumpMap: asphaltBumpMap,
    bumpScale: 0.018,
    roughness: 0.22,
    metalness: 0.12,
    clearcoat: 0.72,
    clearcoatMap: asphaltSpecMap,
    clearcoatRoughness: 0.08,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(44, 78, 1, 1), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -2.1, -18);
  enableAoMap(ground);
  scene.add(ground);

  const waterFilmMaterial = new THREE.MeshStandardMaterial({
    color: "#0b2424",
    normalMap: rainGroundNormal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughnessMap: rainGroundRoughness,
    roughness: 0.035,
    metalness: 0.18,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const waterFilm = new THREE.Mesh(new THREE.PlaneGeometry(44, 78, 1, 1), waterFilmMaterial);
  waterFilm.rotation.x = -Math.PI / 2;
  waterFilm.position.set(0, -2.055, -18);
  scene.add(waterFilm);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: "#5d635b",
    map: brickWallMap,
    normalMap: brickWallNormal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: brickWallRoughness,
    aoMap: brickWallAo,
    aoMapIntensity: 0.82,
    bumpMap: brickWallHeight,
    bumpScale: 0.032,
    roughness: 0.48,
    metalness: 0.03,
  });

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(44, 20, 1, 1), wallMaterial);
  wall.position.set(0, 5.8, -26);
  enableAoMap(wall);
  scene.add(wall);

  const sideWallMaterial = new THREE.MeshStandardMaterial({
    color: "#454d47",
    map: brickWallMap,
    normalMap: brickWallNormal,
    normalScale: new THREE.Vector2(0.58, 0.58),
    roughnessMap: brickWallRoughness,
    aoMap: brickWallAo,
    aoMapIntensity: 0.78,
    bumpMap: brickWallHeight,
    bumpScale: 0.026,
    roughness: 0.56,
    metalness: 0.02,
  });

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 19), sideWallMaterial);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(18.4, 5.4, -13.4);
  enableAoMap(rightWall);
  scene.add(rightWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 17), sideWallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-16.8, 4.8, -15.8);
  enableAoMap(leftWall);
  scene.add(leftWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 72, 1, 1),
    new THREE.MeshStandardMaterial({
      color: "#080c0d",
      roughness: 0.74,
      metalness: 0.08,
    })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 12.2, -18);
  scene.add(ceiling);

  const makeTextRuns = ({
    text,
    font,
    canvasWidth,
    canvasHeight,
    textY,
    cellSize,
    worldWidth,
    worldHeight,
    yOffset,
    strokeWidth = 0,
  }) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = strokeWidth;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (strokeWidth > 0) {
      ctx.strokeText(text, canvasWidth * 0.5, textY);
    }
    ctx.fillText(text, canvasWidth * 0.5, textY);

    const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const samples = [
      [0.5, 0.5],
      [0.22, 0.5],
      [0.78, 0.5],
      [0.5, 0.22],
      [0.5, 0.78],
    ];
    const isFilled = (cellX, cellY) =>
      samples.some(([sampleX, sampleY]) => {
        const x = Math.min(canvasWidth - 1, Math.max(0, Math.floor((cellX + sampleX) * cellSize)));
        const y = Math.min(canvasHeight - 1, Math.max(0, Math.floor((cellY + sampleY) * cellSize)));
        return image.data[(y * canvasWidth + x) * 4 + 3] > 20;
      });

    const columns = Math.floor(canvasWidth / cellSize);
    const rows = Math.floor(canvasHeight / cellSize);
    const runs = [];

    for (let row = 0; row < rows; row += 1) {
      let start = -1;
      for (let column = 0; column <= columns; column += 1) {
        const filled = column < columns && isFilled(column, row);
        if (filled && start === -1) {
          start = column;
        } else if ((!filled || column === columns) && start !== -1) {
          const length = column - start;
          const centerX = (start + length * 0.5) * cellSize;
          const centerY = (row + 0.5) * cellSize;
          runs.push({
            x: (centerX / canvasWidth - 0.5) * worldWidth,
            y: (0.5 - centerY / canvasHeight) * worldHeight + yOffset,
            width: (length * cellSize / canvasWidth) * worldWidth,
            height: (cellSize / canvasHeight) * worldHeight,
          });
          start = -1;
        }
      }
    }

    return runs;
  };

  const textBlockGeometry = new THREE.BoxGeometry(1, 1, 1);
  const makeRunMesh = (runs, material, depth, zOffset, inflate = 1) => {
    const mesh = new THREE.InstancedMesh(textBlockGeometry, material, Math.max(1, runs.length));
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    runs.forEach((run, index) => {
      position.set(run.x, run.y, zOffset);
      scale.set(run.width * inflate, run.height * inflate, depth);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  };

  const signBodyMaterial = new THREE.MeshStandardMaterial({
    color: "#d9fffb",
    emissive: "#44d6c4",
    emissiveIntensity: 0.92,
    roughness: 0.12,
    metalness: 0.28,
  });

  const signSideMaterial = new THREE.MeshStandardMaterial({
    color: "#234c4a",
    emissive: "#1aa79c",
    emissiveIntensity: 0.28,
    roughness: 0.28,
    metalness: 0.34,
  });

  const signBackMaterial = new THREE.MeshStandardMaterial({
    color: "#071615",
    emissive: "#0e4d49",
    emissiveIntensity: 0.12,
    roughness: 0.44,
    metalness: 0.22,
  });

  const signShadowMaterial = new THREE.MeshBasicMaterial({
    color: "#00100f",
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const signGlowMaterial = new THREE.MeshBasicMaterial({
    color: "#b8fff7",
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0,
  });

  const signSubtitleMaterial = new THREE.MeshStandardMaterial({
    color: "#ffb197",
    emissive: "#ff7d5d",
    emissiveIntensity: 0.52,
    roughness: 0.2,
    metalness: 0.14,
  });

  const subtitleRuns = makeTextRuns({
    text: "SELF INTRODUCTION",
    font: "800 44px Arial, sans-serif",
    canvasWidth: 768,
    canvasHeight: 128,
    textY: 64,
    cellSize: 3,
    worldWidth: 6.6,
    worldHeight: 0.78,
    yOffset: -0.94,
    strokeWidth: 1,
  });

  const signGroup = new THREE.Group();
  signGroup.position.set(5.1, 4.8, -25.38);
  signGroup.rotation.y = -0.09;

  const keiBarMaterials = [
    signSideMaterial,
    signSideMaterial,
    signSideMaterial,
    signSideMaterial,
    signBodyMaterial,
    signBackMaterial,
  ];
  const keiBarSpecs = [
    { x: -2.74, y: 0.58, width: 0.42, height: 2.58, rotation: 0 },
    { x: -2.2, y: 1.15, width: 0.42, height: 1.52, rotation: -0.66 },
    { x: -2.2, y: 0.01, width: 0.42, height: 1.52, rotation: 0.66 },
    { x: -0.5, y: 0.58, width: 0.42, height: 2.58, rotation: 0 },
    { x: 0.13, y: 1.68, width: 1.32, height: 0.36, rotation: 0 },
    { x: 0.01, y: 0.58, width: 1.06, height: 0.34, rotation: 0 },
    { x: 0.13, y: -0.52, width: 1.32, height: 0.36, rotation: 0 },
    { x: 2.18, y: 0.58, width: 0.42, height: 2.58, rotation: 0 },
    { x: 2.18, y: 1.68, width: 1.18, height: 0.36, rotation: 0 },
    { x: 2.18, y: -0.52, width: 1.18, height: 0.36, rotation: 0 },
  ];

  const makeKeiBarGroup = (material, depth, zOffset, inflate = 1, xOffset = 0, yOffset = 0) => {
    const group = new THREE.Group();
    keiBarSpecs.forEach((spec) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(spec.width * inflate, spec.height * inflate, depth),
        material
      );
      mesh.position.set(spec.x + xOffset, spec.y + yOffset, zOffset);
      mesh.rotation.z = spec.rotation;
      mesh.frustumCulled = false;
      group.add(mesh);
    });
    return group;
  };

  const keiShadow = makeKeiBarGroup(signShadowMaterial, 0.12, -0.72, 1.08, 0.15, -0.15);
  const keiText = makeKeiBarGroup(keiBarMaterials, 0.92, 0, 1);
  const keiGlow = makeKeiBarGroup(signGlowMaterial, 0.055, 0.52, 1.13);
  const subtitleShadow = makeRunMesh(subtitleRuns, signShadowMaterial, 0.055, -0.42, 1.12);
  const subtitleText = makeRunMesh(subtitleRuns, signSubtitleMaterial, 0.26, 0.11, 1);
  const subtitleGlow = makeRunMesh(subtitleRuns, signGlowMaterial, 0.032, 0.3, 1.12);

  const signUnderline = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.055, 0.16), signSubtitleMaterial);
  signUnderline.position.set(0, -1.36, 0.08);

  keiShadow.renderOrder = 1;
  keiText.renderOrder = 2;
  subtitleShadow.renderOrder = 1;
  subtitleText.renderOrder = 2;
  keiGlow.renderOrder = 3;
  subtitleGlow.renderOrder = 3;
  signUnderline.renderOrder = 2;

  signGroup.add(keiShadow, subtitleShadow, keiText, subtitleText, signUnderline, keiGlow, subtitleGlow);
  scene.add(signGroup);

  const makeLightBox = (color, width, height, depth, intensity) => {
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.22,
      metalness: 0.16,
    });
    return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  };

  const rightLampHigh = makeLightBox("#d8fbff", 2.1, 0.72, 0.16, 2.8);
  rightLampHigh.position.set(13.2, 7.4, -25.42);
  scene.add(rightLampHigh);

  const rightLampLow = makeLightBox("#fff0dc", 1.7, 0.58, 0.16, 1.9);
  rightLampLow.position.set(11.9, 2.55, -25.4);
  scene.add(rightLampLow);

  const leftLamp = makeLightBox("#ffe0c9", 1.4, 0.5, 0.16, 1.7);
  leftLamp.position.set(-9.4, 3.6, -25.42);
  scene.add(leftLamp);

  const reflectionMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uLightPower: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;

      uniform float uLightPower;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        float perspective = smoothstep(0.02, 0.86, uv.y) * (1.0 - smoothstep(0.93, 1.0, uv.y));
        float center = 1.0 - smoothstep(0.18, 0.68, abs(uv.x - 0.5));
        float edgeMask = smoothstep(0.0, 0.2, uv.x) * smoothstep(0.0, 0.2, 1.0 - uv.x);
        float asphaltSheen = 0.18 + sin(uv.y * 18.0 + sin(uv.x * 10.0) * 0.6) * 0.035;
        float wet = center * perspective * edgeMask * asphaltSheen;
        vec3 teal = vec3(0.18, 0.78, 0.78);
        vec3 warm = vec3(0.95, 0.36, 0.24);
        vec3 color = mix(teal, warm, smoothstep(0.34, 0.72, uv.x)) * wet * uLightPower;
        gl_FragColor = vec4(color, wet * 0.48);
      }
    `,
  });

  const reflection = new THREE.Mesh(new THREE.PlaneGeometry(22, 36, 1, 1), reflectionMaterial);
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(5.6, -2.062, -10.8);
  scene.add(reflection);

  const makeWetStreaks = () => {
    const positions = [];
    for (let i = 0; i < 96; i += 1) {
      const x = THREE.MathUtils.randFloatSpread(32);
      const y = THREE.MathUtils.randFloat(1.4, 11.5);
      const length = THREE.MathUtils.randFloat(0.6, 3.6);
      positions.push(x, y, -25.03, x + THREE.MathUtils.randFloat(-0.04, 0.04), y - length, -25.02);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: "#9edbd9",
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.LineSegments(geometry, material);
  };
  scene.add(makeWetStreaks());

  const ambient = new THREE.HemisphereLight("#9feeff", "#050707", 0.52);
  scene.add(ambient);

  const signLight = new THREE.PointLight("#44d6c4", 6.2, 42, 1.65);
  signLight.position.set(5.1, 4.7, -19.4);
  scene.add(signLight);

  const signRimLight = new THREE.PointLight("#e8fffb", 1.8, 18, 1.55);
  signRimLight.position.set(2.6, 6.15, -23.4);
  scene.add(signRimLight);

  const warmLight = new THREE.PointLight("#ff8a62", 2.7, 34, 1.55);
  warmLight.position.set(12.2, 3.7, -16.2);
  scene.add(warmLight);

  const coolBackLight = new THREE.PointLight("#d7fbff", 4.2, 46, 1.75);
  coolBackLight.position.set(14, 5.4, -18.2);
  scene.add(coolBackLight);

  const warmBackLight = new THREE.PointLight("#ffe0c9", 2.1, 36, 1.82);
  warmBackLight.position.set(-10.8, 3.3, -18.6);
  scene.add(warmBackLight);

  const cameraSideLight = new THREE.PointLight("#f4ffff", 1.8, 24, 1.7);
  cameraSideLight.position.set(-4.8, 2.4, 2.8);
  scene.add(cameraSideLight);

  const lightning = new THREE.PointLight("#bdefff", 0, 52, 1.25);
  lightning.position.set(0, 9.5, -10);
  scene.add(lightning);

  const flashOverlay = document.querySelector("[data-lightning-flash]");

  const boltGroup = new THREE.Group();
  boltGroup.position.set(1.8, 0, -22.5);
  scene.add(boltGroup);

  const boltPointCapacity = 40;
  const createBoltStrand = (color, baseOpacity) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(boltPointCapacity * 3), 3)
    );
    geometry.setDrawRange(0, 0);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.userData.baseOpacity = baseOpacity;
    boltGroup.add(line);
    return line;
  };

  const boltGlowB = createBoltStrand("#6fd4f2", 0.32);
  const boltGlowA = createBoltStrand("#9fe9ff", 0.55);
  const boltCore = createBoltStrand("#f4feff", 0.95);
  const boltBranch = createBoltStrand("#eafcff", 0.6);
  const boltStrands = [boltCore, boltGlowA, boltGlowB, boltBranch];

  const displaceBoltPath = (start, end, iterations, spread) => {
    let points = [start.clone(), end.clone()];
    let amount = spread;
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const next = [points[0]];
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        const mid = a.clone().lerp(b, 0.5 + THREE.MathUtils.randFloatSpread(0.3));
        mid.x += THREE.MathUtils.randFloatSpread(amount);
        mid.z += THREE.MathUtils.randFloatSpread(amount * 0.6);
        next.push(mid, b);
      }
      points = next;
      amount *= 0.54;
    }
    return points;
  };

  const writeBoltStrand = (line, points, jitter) => {
    const positions = line.geometry.attributes.position.array;
    const count = Math.min(points.length, boltPointCapacity);
    for (let i = 0; i < count; i += 1) {
      const point = points[i];
      positions[i * 3] = point.x + (jitter ? THREE.MathUtils.randFloatSpread(jitter) : 0);
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z + (jitter ? THREE.MathUtils.randFloatSpread(jitter * 0.6) : 0);
    }
    line.geometry.setDrawRange(0, count);
    line.geometry.attributes.position.needsUpdate = true;
    line.geometry.computeBoundingSphere();
  };

  const regenerateBolt = () => {
    const top = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1.6),
      11.2 + THREE.MathUtils.randFloatSpread(0.4),
      THREE.MathUtils.randFloatSpread(1)
    );
    const bottom = new THREE.Vector3(
      top.x + THREE.MathUtils.randFloatSpread(3.4),
      THREE.MathUtils.randFloat(2.4, 4.4),
      top.z + THREE.MathUtils.randFloatSpread(1.6)
    );
    const mainPath = displaceBoltPath(top, bottom, 5, 1.3);

    writeBoltStrand(boltCore, mainPath, 0);
    writeBoltStrand(boltGlowA, mainPath, 0.05);
    writeBoltStrand(boltGlowB, mainPath, 0.1);

    const branchStart = mainPath[Math.floor(mainPath.length * THREE.MathUtils.randFloat(0.3, 0.55))];
    const branchEnd = branchStart
      .clone()
      .add(
        new THREE.Vector3(
          THREE.MathUtils.randFloat(0.9, 1.8) * (Math.random() < 0.5 ? -1 : 1),
          THREE.MathUtils.randFloat(-2.4, -1.2),
          THREE.MathUtils.randFloatSpread(1)
        )
      );
    const branchPath = displaceBoltPath(branchStart, branchEnd, 3, 0.7);
    writeBoltStrand(boltBranch, branchPath, 0);
  };

  const rainMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: 2.55 },
      uHeightRange: { value: 15 },
      uWind: { value: -0.055 },
      uOpacity: { value: 0.78 },
      uRefraction: { value: 0.028 },
      uBgRt: { value: bgTarget.texture },
    },
    vertexShader: `
      precision mediump float;

      attribute vec3 aOffset;
      attribute vec2 aScale;
      attribute float aSpeed;
      attribute float aProgress;
      attribute float aAlpha;

      uniform float uTime;
      uniform float uSpeed;
      uniform float uHeightRange;
      uniform float uWind;

      varying vec2 vUv;
      varying vec2 vScreen;
      varying float vAlpha;

      void main() {
        vUv = uv;
        float fall = mod(aProgress - uTime * aSpeed * 0.082 * uSpeed, 1.0);
        float y = fall * uHeightRange - uHeightRange * 0.5;
        vec3 base = aOffset;
        base.y += y;
        base.x += y * uWind;

        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 worldPosition = base + right * position.x * aScale.x + up * position.y * aScale.y;

        vec4 clip = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
        vScreen = clip.xy / clip.w * 0.5 + 0.5;
        vAlpha = aAlpha;
        gl_Position = clip;
      }
    `,
    fragmentShader: `
      precision mediump float;

      uniform sampler2D uBgRt;
      uniform float uOpacity;
      uniform float uRefraction;

      varying vec2 vUv;
      varying vec2 vScreen;
      varying float vAlpha;

      void main() {
        float core = 1.0 - smoothstep(0.02, 0.47, abs(vUv.x - 0.5));
        float taper = smoothstep(0.03, 0.22, vUv.y) * (1.0 - smoothstep(0.72, 1.0, vUv.y));
        float drop = core * taper;
        vec2 screenUv = clamp(vScreen, vec2(0.001), vec2(0.999));
        vec2 refractUv = clamp(
          screenUv + vec2((vUv.x - 0.5) * uRefraction, (vUv.y - 0.5) * uRefraction * 0.7),
          vec2(0.001),
          vec2(0.999)
        );
        vec3 refracted = texture2D(uBgRt, refractUv).rgb;
        float edge = smoothstep(0.08, 0.78, core) * (1.0 - smoothstep(0.24, 0.5, abs(vUv.x - 0.5)));
        float tip = smoothstep(0.7, 0.98, vUv.y) * core * 0.45;
        float backlight = smoothstep(0.08, 0.62, dot(refracted, vec3(0.299, 0.587, 0.114)));
        vec3 color = refracted * 0.24 + vec3(edge * 0.18 + tip * 0.08 + backlight * drop * 0.07);
        float alpha = drop * vAlpha * uOpacity;
        if (alpha < 0.006) {
          discard;
        }
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

  const createRainLayer = (count, depthStart, depthEnd, width, alphaBase) => {
    const baseGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = baseGeometry.index;
    geometry.attributes.position = baseGeometry.attributes.position;
    geometry.attributes.uv = baseGeometry.attributes.uv;

    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count * 2);
    const speeds = new Float32Array(count);
    const progresses = new Float32Array(count);
    const alphas = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const z = THREE.MathUtils.randFloat(depthEnd, depthStart);
      const depthFactor = THREE.MathUtils.clamp((z - depthEnd) / (depthStart - depthEnd), 0, 1);
      offsets[i * 3] = THREE.MathUtils.randFloatSpread(width);
      offsets[i * 3 + 1] = THREE.MathUtils.randFloat(2.8, 5.7);
      offsets[i * 3 + 2] = z;
      scales[i * 2] = THREE.MathUtils.randFloat(0.022, 0.055) * (0.8 + depthFactor * 1.4);
      scales[i * 2 + 1] = THREE.MathUtils.randFloat(0.72, 1.75) * (0.78 + depthFactor * 0.72);
      speeds[i] = THREE.MathUtils.randFloat(1.28, 2.44) * (0.85 + depthFactor * 0.72);
      progresses[i] = Math.random();
      alphas[i] = alphaBase * THREE.MathUtils.randFloat(0.54, 1);
    }

    geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 2));
    geometry.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(speeds, 1));
    geometry.setAttribute("aProgress", new THREE.InstancedBufferAttribute(progresses, 1));
    geometry.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(alphas, 1));

    const mesh = new THREE.Mesh(geometry, rainMaterial);
    mesh.frustumCulled = false;
    return mesh;
  };

  const rainGroup = new THREE.Group();
  rainGroup.add(createRainLayer(isCompact ? 920 : 1700, 8.5, -28, 34, 0.72));
  rainGroup.add(createRainLayer(isCompact ? 360 : 680, 8.8, -4, 26, 0.92));
  rainGroup.add(createRainLayer(isCompact ? 80 : 160, 7.8, 2.2, 16, 0.78));
  scene.add(rainGroup);

  const resize = () => {
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    const targetRatio = 0.32;
    bgTarget.setSize(Math.max(2, Math.floor(width * targetRatio)), Math.max(2, Math.floor(height * targetRatio)));
    if (glitchCanvas) {
      glitchCanvas.width = Math.max(160, Math.floor(width * 0.48));
      glitchCanvas.height = Math.max(90, Math.floor(height * 0.48));
    }
  };

  const renderBackgroundTarget = () => {
    rainGroup.visible = false;
    renderer.setRenderTarget(bgTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    rainGroup.visible = true;
  };

  const updatePointerTarget = (event) => {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    pointerTarget.x = THREE.MathUtils.clamp((event.clientX / width - 0.5) * 2, -1, 1);
    pointerTarget.y = THREE.MathUtils.clamp((event.clientY / height - 0.5) * 2, -1, 1);
  };

  window.addEventListener("pointermove", updatePointerTarget, { passive: true });
  window.addEventListener(
    "pointerleave",
    () => {
      pointerTarget.set(0, 0);
    },
    { passive: true }
  );

  const soundToggle = document.querySelector("[data-sound-toggle]");
  let audioContext = null;
  let masterGain = null;
  let soundEnabled = false;
  let rainLoopGain = null;
  let buzzToneGain = null;
  let buzzNoiseGain = null;

  const createNoiseBuffer = (ctx, duration) => {
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const buildSceneAudio = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioContext.destination);

   const rainSource = audioContext.createBufferSource();
rainSource.loop = true;
rainLoopGain = audioContext.createGain();
rainLoopGain.gain.value = 0.5;
rainSource.connect(rainLoopGain);
rainLoopGain.connect(masterGain);

fetch("audio/rain.mp3")
  .then((response) => response.arrayBuffer())
  .then((data) => audioContext.decodeAudioData(data))
  .then((buffer) => {
    rainSource.buffer = buffer;
    rainSource.start();
  });

    const gustLfo = audioContext.createOscillator();
    gustLfo.frequency.value = 0.06;
    const gustLfoGain = audioContext.createGain();
    gustLfoGain.gain.value = 0.1;
    gustLfo.connect(gustLfoGain);
    gustLfoGain.connect(rainLoopGain.gain);
    gustLfo.start();

    const buzzTone = audioContext.createOscillator();
    buzzTone.type = "sawtooth";
    buzzTone.frequency.value = 94;
    buzzToneGain = audioContext.createGain();
    buzzToneGain.gain.value = 0.015;
    buzzTone.connect(buzzToneGain);
    buzzToneGain.connect(masterGain);
    buzzTone.start();

    const buzzNoiseSource = audioContext.createBufferSource();
    buzzNoiseSource.buffer = createNoiseBuffer(audioContext, 2);
    buzzNoiseSource.loop = true;
    const buzzNoiseFilter = audioContext.createBiquadFilter();
    buzzNoiseFilter.type = "bandpass";
    buzzNoiseFilter.frequency.value = 2500;
    buzzNoiseFilter.Q.value = 0.7;
    buzzNoiseGain = audioContext.createGain();
    buzzNoiseGain.gain.value = 0;
    buzzNoiseSource.connect(buzzNoiseFilter);
    buzzNoiseFilter.connect(buzzNoiseGain);
    buzzNoiseGain.connect(masterGain);
    buzzNoiseSource.start();

    return true;
  };

  const updateSignBuzzAudio = (power) => {
    if (!audioContext || !buzzToneGain || !buzzNoiseGain) {
      return;
    }
    const instability = THREE.MathUtils.clamp(Math.abs(power - 1) * 0.45, 0, 1);
    const now = audioContext.currentTime;
    buzzToneGain.gain.setTargetAtTime(0.015 + instability * 0.05, now, 0.03);
    buzzNoiseGain.gain.setTargetAtTime(instability * 0.18, now, 0.02);
  };

  const playThunderSound = (strong) => {
    if (!audioContext || !masterGain) {
      return;
    }
    const now = audioContext.currentTime;
    const delay = strong
      ? THREE.MathUtils.randFloat(0.05, 0.16)
      : THREE.MathUtils.randFloat(0.25, 0.7);

    const crackSource = audioContext.createBufferSource();
    crackSource.buffer = createNoiseBuffer(audioContext, 0.3);
    const crackFilter = audioContext.createBiquadFilter();
    crackFilter.type = "bandpass";
    crackFilter.frequency.value = 1400;
    crackFilter.Q.value = 0.6;
    const crackGain = audioContext.createGain();
    crackGain.gain.value = 0;
    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(masterGain);
    const crackStart = now + delay;
    crackGain.gain.setValueAtTime(0, crackStart);
    crackGain.gain.linearRampToValueAtTime(strong ? 0.9 : 0.5, crackStart + 0.012);
    crackGain.gain.exponentialRampToValueAtTime(0.001, crackStart + 0.26);
    crackSource.start(crackStart);
    crackSource.stop(crackStart + 0.32);

    const rumbleSource = audioContext.createBufferSource();
    rumbleSource.buffer = createNoiseBuffer(audioContext, 2.4);
    const rumbleFilter = audioContext.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 170;
    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.value = 0;
    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    const rumbleStart = crackStart + 0.05;
    const rumbleDuration = strong ? 2.6 : 1.8;
    rumbleGain.gain.setValueAtTime(0, rumbleStart);
    rumbleGain.gain.linearRampToValueAtTime(strong ? 0.55 : 0.32, rumbleStart + 0.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, rumbleStart + rumbleDuration);
    rumbleSource.start(rumbleStart);
    rumbleSource.stop(rumbleStart + rumbleDuration + 0.1);
  };

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      if (!audioContext) {
        const ready = buildSceneAudio();
        if (!ready) {
          soundToggle.disabled = true;
          soundToggle.setAttribute("aria-pressed", "false");
          return;
        }
      }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      soundEnabled = !soundEnabled;
      soundToggle.setAttribute("aria-pressed", String(soundEnabled));
      const now = audioContext.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(soundEnabled ? 0.85 : 0, now, 0.3);
    });
  }

  let animationFrame = 0;
  let nextFlickerAt = 1.6;
  let flickerUntil = 0;
  let flickerPower = 1;
  let nextGlitchAt = 3.4;
  let glitchUntil = 0;

  const updateLights = (elapsed) => {
    if (elapsed > nextFlickerAt) {
      flickerUntil = elapsed + THREE.MathUtils.randFloat(0.08, 0.32);
      flickerPower = Math.random() < 0.52 ? 0.14 : THREE.MathUtils.randFloat(2.7, 4.6);
      nextFlickerAt = elapsed + THREE.MathUtils.randFloat(2.2, 4.8);
    }

    const power = elapsed < flickerUntil ? flickerPower : 1;
    const flash = Math.max(0, power - 1);
    updateSignBuzzAudio(power);
    const signBoost = 1 + flash * 0.5;
    const glowBoost = 1 + flash * 0.74;
    signBodyMaterial.color.setRGB(0.82 * signBoost, 1 * signBoost, 0.98 * signBoost);
    signBodyMaterial.emissiveIntensity = 0.48 + power * 0.46 + flash * 1.9;
    signSideMaterial.emissiveIntensity = 0.18 + power * 0.18 + flash * 0.92;
    signBackMaterial.emissiveIntensity = 0.06 + power * 0.08 + flash * 0.42;
    signSubtitleMaterial.color.setRGB(1 * (1 + flash * 0.24), 0.67 * signBoost, 0.55 * signBoost);
    signSubtitleMaterial.emissiveIntensity = 0.24 + power * 0.28 + flash * 0.92;
    signGlowMaterial.opacity = THREE.MathUtils.clamp(flash * 0.28, 0, 0.86);
    signGlowMaterial.color.setRGB(0.7 * glowBoost, 1 * glowBoost, 0.96 * glowBoost);
    signLight.intensity = 1.65 + power * 3.45 + flash * 9.8;
    signRimLight.intensity = 1.15 + power * 0.8 + flash * 2.8;
    signLight.distance = 42 + flash * 7;
    reflectionMaterial.uniforms.uLightPower.value = 1.05 + power * 0.68 + flash * 0.36;
  };

  let nextLightningAt = 5.5;
  let activeLightningStrike = null;
  const fogBaseColor = new THREE.Color("#061012");
  const fogFlashColor = new THREE.Color("#bdeeff");
  const baseToneExposure = renderer.toneMappingExposure;

  const triggerLightningStrike = (elapsed) => {
    const pulseCount = THREE.MathUtils.randInt(2, 4);
    const pulses = [];
    let cursor = 0;
    for (let i = 0; i < pulseCount; i += 1) {
      pulses.push({ offset: cursor, peak: i === 0 ? 1 : THREE.MathUtils.randFloat(0.32, 0.78) });
      cursor += THREE.MathUtils.randFloat(0.04, 0.13);
    }
    const showBolt = Math.random() < 0.62;
    if (showBolt) {
      regenerateBolt();
    }
    const strong = Math.random() < 0.4;
    playThunderSound(strong);
    activeLightningStrike = {
      start: elapsed,
      pulses,
      duration: cursor + 0.3,
      showBolt,
      strong,
    };
  };

  const sampleLightningStrike = (elapsed) => {
    if (!activeLightningStrike) {
      return 0;
    }
    const t = elapsed - activeLightningStrike.start;
    if (t > activeLightningStrike.duration) {
      activeLightningStrike = null;
      return 0;
    }
    let value = 0;
    activeLightningStrike.pulses.forEach((pulse) => {
      if (t >= pulse.offset) {
        value = Math.max(value, pulse.peak * Math.exp(-(t - pulse.offset) * 17));
      }
    });
    return THREE.MathUtils.clamp(value, 0, 1);
  };

  const updateLightning = (elapsed) => {
    if (elapsed > nextLightningAt) {
      nextLightningAt = elapsed + THREE.MathUtils.randFloat(6, 12);
      if (Math.random() < 0.45) {
        triggerLightningStrike(elapsed);
      }
    }

    const strength = sampleLightningStrike(elapsed);
    lightning.intensity = strength * 11.5;

    const boltActive = Boolean(activeLightningStrike && activeLightningStrike.showBolt);
    const boltOpacity = boltActive ? strength : 0;
    boltStrands.forEach((line) => {
      line.material.opacity = boltOpacity * line.userData.baseOpacity;
    });

    if (flashOverlay) {
      flashOverlay.style.opacity = (strength * 0.62).toFixed(3);
    }

    reflectionMaterial.uniforms.uLightPower.value += strength * 0.85;
    renderer.toneMappingExposure = baseToneExposure + strength * 0.4;
    scene.fog.color.copy(fogBaseColor).lerp(fogFlashColor, strength * 0.75);

    if (activeLightningStrike && activeLightningStrike.strong) {
      const shake = Math.max(0, 1 - (elapsed - activeLightningStrike.start) * 7) * strength;
      lightningShakeOffset.set(
        THREE.MathUtils.randFloatSpread(0.05) * shake,
        THREE.MathUtils.randFloatSpread(0.032) * shake,
        0
      );
    } else {
      lightningShakeOffset.set(0, 0, 0);
    }
  };

  const drawGlitchNoise = () => {
    if (!glitchContext || !glitchCanvas) {
      return;
    }

    const width = glitchCanvas.width;
    const height = glitchCanvas.height;
    const palette = [
      [68, 214, 196],
      [255, 56, 96],
      [255, 241, 188],
      [202, 244, 255],
      [124, 116, 255],
    ];

    glitchContext.clearRect(0, 0, width, height);
    glitchContext.globalCompositeOperation = "source-over";

    const grainCount = Math.floor((width * height) / 760);
    for (let i = 0; i < grainCount; i += 1) {
      const color = palette[THREE.MathUtils.randInt(0, palette.length - 1)];
      const alpha = THREE.MathUtils.randFloat(0.08, 0.5);
      const size = Math.random() < 0.82 ? 1 : THREE.MathUtils.randInt(2, 4);
      glitchContext.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
      glitchContext.fillRect(
        THREE.MathUtils.randInt(0, width),
        THREE.MathUtils.randInt(0, height),
        size,
        size
      );
    }

    const blockCount = THREE.MathUtils.randInt(18, 34);
    for (let i = 0; i < blockCount; i += 1) {
      const color = palette[THREE.MathUtils.randInt(0, palette.length - 1)];
      const blockWidth = THREE.MathUtils.randInt(6, Math.max(12, Math.floor(width * 0.11)));
      const blockHeight = THREE.MathUtils.randInt(2, Math.max(3, Math.floor(height * 0.018)));
      const alpha = THREE.MathUtils.randFloat(0.12, 0.58);
      glitchContext.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
      glitchContext.fillRect(
        THREE.MathUtils.randInt(-20, width),
        THREE.MathUtils.randInt(0, height),
        blockWidth,
        blockHeight
      );
    }

    const sparkCount = THREE.MathUtils.randInt(34, 64);
    glitchContext.globalCompositeOperation = "lighter";
    for (let i = 0; i < sparkCount; i += 1) {
      const color = palette[THREE.MathUtils.randInt(0, palette.length - 1)];
      const x = THREE.MathUtils.randInt(0, width);
      const y = THREE.MathUtils.randInt(0, height);
      const length = THREE.MathUtils.randInt(2, 14);
      glitchContext.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${THREE.MathUtils.randFloat(0.16, 0.62)})`;
      glitchContext.fillRect(x, y, length, 1);
    }

    glitchContext.globalCompositeOperation = "source-over";
  };

  const randomizeGlitch = () => {
    if (!glitchLayer) {
      return;
    }

    const wideShift = THREE.MathUtils.randInt(-24, 24);
    const canvasShift = THREE.MathUtils.randInt(-10, 10);
    document.documentElement.style.setProperty("--glitch-canvas-x", `${canvasShift}px`);
    document.documentElement.style.setProperty("--glitch-hue", `${THREE.MathUtils.randFloat(-7, 7).toFixed(2)}deg`);
    glitchLayer.style.setProperty("--glitch-wide-x", `${wideShift}px`);
    glitchLayer.style.setProperty("--glitch-opacity", THREE.MathUtils.randFloat(0.72, 1).toFixed(2));
    glitchLayer.style.setProperty("--noise-opacity", THREE.MathUtils.randFloat(0.58, 0.9).toFixed(2));
    glitchLayer.style.setProperty("--slice-opacity", THREE.MathUtils.randFloat(0.18, 0.42).toFixed(2));

    glitchSlices.forEach((slice) => {
      slice.style.setProperty("--slice-y", `${THREE.MathUtils.randFloat(4, 92).toFixed(2)}%`);
      slice.style.setProperty("--slice-h", `${THREE.MathUtils.randFloat(0.35, 2.2).toFixed(2)}vh`);
      slice.style.setProperty("--slice-x", `${THREE.MathUtils.randInt(-28, 28)}px`);
      slice.style.setProperty("--slice-skew", `${THREE.MathUtils.randFloat(-4.5, 4.5).toFixed(2)}deg`);
    });
  };

  const updateGlitch = (elapsed) => {
    if (!glitchLayer || reduceMotion) {
      return;
    }

    if (elapsed > nextGlitchAt) {
      randomizeGlitch();
      glitchUntil = elapsed + THREE.MathUtils.randFloat(0.075, 0.18);
      nextGlitchAt = elapsed + THREE.MathUtils.randFloat(3.8, 9.2);
      glitchLayer.classList.add("is-active");
      document.documentElement.classList.add("cyber-glitching");
    }

    if (elapsed > glitchUntil && glitchLayer.classList.contains("is-active")) {
      glitchLayer.classList.remove("is-active");
      document.documentElement.classList.remove("cyber-glitching");
      document.documentElement.style.removeProperty("--glitch-canvas-x");
      document.documentElement.style.removeProperty("--glitch-hue");
      if (glitchContext && glitchCanvas) {
        glitchContext.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
      }
    } else if (elapsed < glitchUntil && Math.random() < 0.16) {
      randomizeGlitch();
    }

    if (elapsed < glitchUntil) {
      drawGlitchNoise();
    }
  };

  const easeScroll = (value) => {
    const clamped = THREE.MathUtils.clamp(value, 0, 1);
    return clamped * clamped * (3 - clamped * 2);
  };

  const getStoryCameraState = () => {
    if (!storyElement) {
      return { focus: 0, progress: 0 };
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const storyTop = storyElement.getBoundingClientRect().top + scrollY;
    const desktop = window.matchMedia("(min-width: 981px)").matches;
    const storyDuration = desktop
      ? storyPageCount * 680
      : Math.max(window.innerHeight, storyElement.offsetHeight - window.innerHeight);
    const leadIn = Math.max(240, window.innerHeight * 0.72);
    const leadOut = Math.max(260, window.innerHeight * 0.62);
    const storyEnd = storyTop + storyDuration;
    const enter = easeScroll((scrollY - (storyTop - leadIn)) / leadIn);
    const exit = 1 - easeScroll((scrollY - storyEnd) / leadOut);
    const focus = enter * exit;
    const progress = THREE.MathUtils.clamp((scrollY - storyTop) / Math.max(1, storyDuration), 0, 1);

    return { focus, progress };
  };

  const updateScrollCamera = () => {
    const { focus, progress } = getStoryCameraState();

    if (focus <= 0.001) {
      cameraTargetPosition.copy(baseCameraPosition);
      cameraTargetLookTarget.copy(lookTarget);
    } else {
      const chapterProgress = progress * storyPanelCount;
      const currentIndex = THREE.MathUtils.clamp(
        Math.floor(chapterProgress),
        0,
        scrollCameraViews.length - 1
      );
      const localProgress = chapterProgress - currentIndex;
      const transitionStart = 0.82;
      const transitionProgress =
        currentIndex < scrollCameraViews.length - 1
          ? easeScroll((localProgress - transitionStart) / (1 - transitionStart))
          : 0;
      const currentView = scrollCameraViews[currentIndex];
      const nextView = scrollCameraViews[Math.min(currentIndex + 1, scrollCameraViews.length - 1)];

      cameraTargetPosition.lerpVectors(currentView.position, nextView.position, transitionProgress);
      cameraTargetLookTarget.lerpVectors(currentView.target, nextView.target, transitionProgress);
      cameraTargetPosition.lerpVectors(baseCameraPosition, cameraTargetPosition, focus);
      cameraTargetLookTarget.lerpVectors(lookTarget, cameraTargetLookTarget, focus);
    }

    cameraCurrentPosition.lerp(cameraTargetPosition, 0.035);
    cameraCurrentLookTarget.lerp(cameraTargetLookTarget, 0.035);
  };

  const render = () => {
    const elapsed = clock.getElapsedTime();
    pointerCurrent.lerp(pointerTarget, 0.075);
    updateScrollCamera();

    camera.position.copy(cameraCurrentPosition);
    camera.position.x += pointerCurrent.x * 0.5;
    camera.position.y -= pointerCurrent.y * 0.22;
    camera.position.z += Math.abs(pointerCurrent.x) * 0.08;
    dynamicLookTarget.set(
      cameraCurrentLookTarget.x + pointerCurrent.x * 0.95,
      cameraCurrentLookTarget.y - pointerCurrent.y * 0.38,
      cameraCurrentLookTarget.z
    );
    camera.position.add(lightningShakeOffset);
    camera.lookAt(dynamicLookTarget);

    rainMaterial.uniforms.uTime.value = elapsed;
    signGroup.position.y = 4.8 + Math.sin(elapsed * 0.8) * 0.018;
    signGroup.rotation.y = -0.09 + pointerCurrent.x * 0.045;
    signGroup.rotation.x = pointerCurrent.y * 0.012;
    updateLights(elapsed);
    updateLightning(elapsed);
    updateGlitch(elapsed);

    renderBackgroundTarget();
    renderer.render(scene, camera);

    if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!document.hidden && !reduceMotion && !animationFrame) {
      clock.getDelta();
      animationFrame = window.requestAnimationFrame(render);
    }
  });

  resize();
  render();
})();
