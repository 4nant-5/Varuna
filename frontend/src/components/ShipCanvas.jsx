import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ShipCanvas({ scrollProgress = 0 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const shipGroupRef = useRef(null);
  const oceanRef = useRef(null);
  const radarRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.018);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(18, 10, 24);
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f2b48, 2.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    sunLight.position.set(25, 40, 20);
    scene.add(sunLight);

    const warmFill = new THREE.DirectionalLight(0xffa34d, 1.2);
    warmFill.position.set(-20, 15, -15);
    scene.add(warmFill);

    const bottomGlow = new THREE.PointLight(0x06b6d4, 3, 30);
    bottomGlow.position.set(0, -2, 0);
    scene.add(bottomGlow);

    // ─── Procedural Bulk Carrier Ship Model ──────────────────────
    const shipGroup = new THREE.Group();
    shipGroupRef.current = shipGroup;

    // Materials
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x111927,
      metalness: 0.6,
      roughness: 0.4,
    });
    const hullRedMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b1e1e, // Red underwater hull
      metalness: 0.5,
      roughness: 0.5,
    });
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.3,
      roughness: 0.7,
    });
    const hatchMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant maritime blue hatch covers
      metalness: 0.7,
      roughness: 0.3,
    });
    const superstructureMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Crisp white superstructure
      metalness: 0.2,
      roughness: 0.3,
    });
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });
    const funnelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.5,
      roughness: 0.4,
    });

    // 1. Lower Hull (Red antifouling bottom)
    const lowerHullGeo = new THREE.BoxGeometry(4.2, 1.4, 20);
    const lowerHull = new THREE.Mesh(lowerHullGeo, hullRedMaterial);
    lowerHull.position.y = -0.6;
    shipGroup.add(lowerHull);

    // Lower Bow taper
    const lowerBowGeo = new THREE.ConeGeometry(2.1, 4.5, 4);
    const lowerBow = new THREE.Mesh(lowerBowGeo, hullRedMaterial);
    lowerBow.rotation.x = Math.PI / 2;
    lowerBow.rotation.y = Math.PI / 4;
    lowerBow.position.set(0, -0.6, 12.2);
    lowerBow.scale.set(1, 1, 0.45);
    shipGroup.add(lowerBow);

    // 2. Upper Hull (Dark steel topside)
    const upperHullGeo = new THREE.BoxGeometry(4.4, 2.0, 20);
    const upperHull = new THREE.Mesh(upperHullGeo, hullMaterial);
    upperHull.position.y = 1.0;
    shipGroup.add(upperHull);

    // Bow Cone
    const bowGeo = new THREE.ConeGeometry(2.2, 4.5, 4);
    const bow = new THREE.Mesh(bowGeo, hullMaterial);
    bow.rotation.x = Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 1.0, 12.2);
    bow.scale.set(1, 1, 0.5);
    shipGroup.add(bow);

    // Deck
    const deckGeo = new THREE.BoxGeometry(4.2, 0.2, 23.5);
    const deck = new THREE.Mesh(deckGeo, deckMaterial);
    deck.position.y = 2.05;
    deck.position.z = 1.5;
    shipGroup.add(deck);

    // 3. Cargo Hatches (4 bulk holds)
    const hatchPositions = [6.5, 3.5, 0.5, -2.5];
    hatchPositions.forEach((zPos, idx) => {
      const hatchBaseGeo = new THREE.BoxGeometry(3.2, 0.5, 2.2);
      const hatchBase = new THREE.Mesh(hatchBaseGeo, deckMaterial);
      hatchBase.position.set(0, 2.3, zPos);
      shipGroup.add(hatchBase);

      const hatchCoverGeo = new THREE.BoxGeometry(3.0, 0.2, 2.0);
      const hatchCover = new THREE.Mesh(hatchCoverGeo, hatchMaterial);
      hatchCover.position.set(0, 2.6, zPos);
      shipGroup.add(hatchCover);

      // Deck crane gantry between holds
      if (idx < 3) {
        const cranePostGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6);
        const cranePost = new THREE.Mesh(cranePostGeo, superstructureMaterial);
        cranePost.position.set(0, 2.8, zPos - 1.5);
        shipGroup.add(cranePost);

        const craneJibGeo = new THREE.BoxGeometry(0.1, 0.1, 2.2);
        const craneJib = new THREE.Mesh(craneJibGeo, hatchMaterial);
        craneJib.position.set(0, 3.5, zPos - 1.5);
        craneJib.rotation.x = 0.3;
        shipGroup.add(craneJib);
      }
    });

    // 4. Superstructure / Accommodation Tower (Aft)
    const towerGeo1 = new THREE.BoxGeometry(3.8, 2.4, 3.2);
    const tower1 = new THREE.Mesh(towerGeo1, superstructureMaterial);
    tower1.position.set(0, 3.2, -6.5);
    shipGroup.add(tower1);

    const towerGeo2 = new THREE.BoxGeometry(3.4, 1.4, 2.6);
    const tower2 = new THREE.Mesh(towerGeo2, superstructureMaterial);
    tower2.position.set(0, 4.8, -6.5);
    shipGroup.add(tower2);

    // Navigation Bridge Wings
    const bridgeGeo = new THREE.BoxGeometry(4.8, 0.9, 2.2);
    const bridge = new THREE.Mesh(bridgeGeo, superstructureMaterial);
    bridge.position.set(0, 5.8, -6.5);
    shipGroup.add(bridge);

    // Bridge Windows (Front glowing strip)
    const windowGeo = new THREE.BoxGeometry(4.6, 0.35, 0.1);
    const bridgeWindow = new THREE.Mesh(windowGeo, windowMaterial);
    bridgeWindow.position.set(0, 5.85, -5.35);
    shipGroup.add(bridgeWindow);

    // Funnel / Smokestack
    const funnelGeo = new THREE.CylinderGeometry(0.55, 0.65, 2.2, 8);
    const funnel = new THREE.Mesh(funnelGeo, funnelMaterial);
    funnel.position.set(0, 7.0, -7.5);
    funnel.rotation.x = -0.15;
    shipGroup.add(funnel);

    // Funnel Top band
    const funnelTopGeo = new THREE.CylinderGeometry(0.57, 0.57, 0.4, 8);
    const funnelTop = new THREE.Mesh(funnelTopGeo, hullMaterial);
    funnelTop.position.set(0, 8.0, -7.65);
    shipGroup.add(funnelTop);

    // Radar Mast & Rotating Scanner
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.2);
    const mast = new THREE.Mesh(mastGeo, superstructureMaterial);
    mast.position.set(0, 7.0, -6.2);
    shipGroup.add(mast);

    const radarGeo = new THREE.BoxGeometry(1.2, 0.12, 0.15);
    const radar = new THREE.Mesh(radarGeo, windowMaterial);
    radar.position.set(0, 8.1, -6.2);
    shipGroup.add(radar);
    radarRef.current = radar;

    scene.add(shipGroup);

    // ─── Ocean Plane ─────────────────────────────────────────────
    const oceanGeo = new THREE.PlaneGeometry(160, 160, 60, 60);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x081b2e,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.3;
    scene.add(ocean);
    oceanRef.current = ocean;

    // Wake particle ring
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = -0.15;
      positions[i + 2] = -8 - Math.random() * 22;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.25,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    shipGroup.add(particles);
    particlesRef.current = particles;

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Radar rotation
      if (radarRef.current) {
        radarRef.current.rotation.y += 0.05;
      }

      // Ship gentle wave pitch & roll
      const roll = Math.sin(elapsedTime * 1.2) * 0.035;
      const pitch = Math.cos(elapsedTime * 0.9) * 0.02;
      const heave = Math.sin(elapsedTime * 1.5) * 0.18;

      if (shipGroupRef.current) {
        // Base idle rocking
        shipGroupRef.current.position.y = heave;
        shipGroupRef.current.rotation.z = roll;
        shipGroupRef.current.rotation.x = pitch;
      }

      // Ocean wave vertices displacement
      const positionAttr = oceanGeo.attributes.position;
      for (let i = 0; i < positionAttr.count; i++) {
        const u = positionAttr.getX(i);
        const v = positionAttr.getY(i);
        const z = Math.sin(u * 0.15 + elapsedTime * 1.2) * 0.25 + Math.cos(v * 0.15 + elapsedTime * 1.0) * 0.25;
        positionAttr.setZ(i, z);
      }
      positionAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update ship transform & camera position based on scrollProgress
  useEffect(() => {
    if (!shipGroupRef.current) return;
    const progress = Math.min(Math.max(scrollProgress, 0), 1);

    // 0 to 0.5: ship rotates 180 deg, pulls forward
    // 0.5 to 0.8: ship tilts down, scales down, blends into map
    // > 0.8: scales near 0, fully faded
    const rotationY = progress * Math.PI * 1.8;
    const posX = Math.sin(progress * Math.PI) * 4;
    const posZ = progress * 15 - 2;

    let scale = 1;
    let opacity = 1;
    if (progress > 0.45) {
      const morphProgress = (progress - 0.45) / 0.4;
      scale = Math.max(0.01, 1 - morphProgress * 0.95);
      opacity = Math.max(0, 1 - morphProgress * 1.4);
    }

    shipGroupRef.current.rotation.y = rotationY;
    shipGroupRef.current.position.x = posX;
    shipGroupRef.current.position.z = posZ;
    shipGroupRef.current.scale.set(scale, scale, scale);

    if (containerRef.current) {
      containerRef.current.style.opacity = `${opacity}`;
    }
  }, [scrollProgress]);

  return (
    <div
      ref={containerRef}
      className="ship-canvas-wrapper"
      style={{
        transition: 'opacity 0.4s ease-out',
      }}
    />
  );
}
