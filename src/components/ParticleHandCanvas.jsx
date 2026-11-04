import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// MediaPipe 21-hand landmark connections
const BONE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17]                               // Palm base
];

// Normalized base 3D hand landmarks (palm facing forward/upward, relaxed posture)
const BASE_HAND_LANDMARKS = [
  [0, -1.8, 0],         // 0: Wrist
  [-0.6, -1.2, 0.2],    // 1: Thumb CMC
  [-1.0, -0.6, 0.4],    // 2: Thumb MCP
  [-1.25, -0.1, 0.55],  // 3: Thumb IP
  [-1.45, 0.35, 0.7],   // 4: Thumb TIP
  [-0.55, 0.2, 0.1],    // 5: Index MCP
  [-0.65, 0.9, 0.18],   // 6: Index PIP
  [-0.7, 1.45, 0.22],   // 7: Index DIP
  [-0.72, 1.95, 0.25],  // 8: Index TIP
  [0.0, 0.3, 0.05],     // 9: Middle MCP
  [0.0, 1.05, 0.12],    // 10: Middle PIP
  [0.0, 1.65, 0.16],    // 11: Middle DIP
  [0.0, 2.15, 0.2],     // 12: Middle TIP
  [0.55, 0.2, -0.02],   // 13: Ring MCP
  [0.65, 0.9, 0.05],    // 14: Ring PIP
  [0.7, 1.45, 0.08],    // 15: Ring DIP
  [0.72, 1.92, 0.12],   // 16: Ring TIP
  [1.05, -0.05, -0.1],  // 17: Pinky MCP
  [1.25, 0.6, -0.05],   // 18: Pinky PIP
  [1.35, 1.1, -0.02],   // 19: Pinky DIP
  [1.42, 1.55, 0.02]    // 20: Pinky TIP
];

export default function ParticleHandCanvas({ onTriggerPlay }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId = null;
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(String(renderer));
      } catch {
        return false;
      }
    })();

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 7.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Hand Group
    const handGroup = new THREE.Group();
    scene.add(handGroup);

    // 1. Joint Nodes (21 landmarks)
    const nodeSpheres = [];
    const jointGeom = new THREE.SphereGeometry(0.08, 16, 16);
    const fingertipGeom = new THREE.SphereGeometry(0.12, 16, 16);

    const jointMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b2b });
    const tipMaterial = new THREE.MeshBasicMaterial({ color: 0xffa439 });
    const wristMaterial = new THREE.MeshBasicMaterial({ color: 0xffeed9 });

    BASE_HAND_LANDMARKS.forEach((pos, i) => {
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const isWrist = i === 0;
      const mat = isTip ? tipMaterial : isWrist ? wristMaterial : jointMaterial;
      const geom = isTip ? fingertipGeom : jointGeom;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      handGroup.add(mesh);
      nodeSpheres.push(mesh);
    });

    // 2. Bone Lines
    const linePositions = new Float32Array(BONE_CONNECTIONS.length * 2 * 3);
    const lineColors = new Float32Array(BONE_CONNECTIONS.length * 2 * 3);
    const colorOrange = new THREE.Color(0xff6b2b);
    const colorCream = new THREE.Color(0xfff3e3);

    for (let i = 0; i < BONE_CONNECTIONS.length; i++) {
      const [a, b] = BONE_CONNECTIONS[i];
      const pA = BASE_HAND_LANDMARKS[a];
      const pB = BASE_HAND_LANDMARKS[b];

      linePositions[i * 6 + 0] = pA[0];
      linePositions[i * 6 + 1] = pA[1];
      linePositions[i * 6 + 2] = pA[2];

      linePositions[i * 6 + 3] = pB[0];
      linePositions[i * 6 + 4] = pB[1];
      linePositions[i * 6 + 5] = pB[2];

      const c1 = [4, 8, 12, 16, 20].includes(a) ? colorCream : colorOrange;
      const c2 = [4, 8, 12, 16, 20].includes(b) ? colorCream : colorOrange;

      lineColors[i * 6 + 0] = c1.r;
      lineColors[i * 6 + 1] = c1.g;
      lineColors[i * 6 + 2] = c1.b;

      lineColors[i * 6 + 3] = c2.r;
      lineColors[i * 6 + 4] = c2.g;
      lineColors[i * 6 + 5] = c2.b;
    }

    const boneGeometry = new THREE.BufferGeometry();
    boneGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    boneGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const boneMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      linewidth: 2
    });
    const boneLines = new THREE.LineSegments(boneGeometry, boneMaterial);
    handGroup.add(boneLines);

    // 3. Ambient Musical Particle Cloud
    const particleCount = 280;
    const particleCoords = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      // Swirling cylinder around hand
      const radius = 0.5 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.4) * 4.5;
      const z = (Math.random() - 0.5) * 2.2;

      particleCoords[i * 3 + 0] = Math.cos(angle) * radius;
      particleCoords[i * 3 + 1] = y;
      particleCoords[i * 3 + 2] = z + Math.sin(angle) * 0.4;

      const mix = Math.random();
      const pColor = mix > 0.6 ? colorOrange : mix > 0.3 ? colorCream : new THREE.Color(0xe85d04);
      particleColors[i * 3 + 0] = pColor.r;
      particleColors[i * 3 + 1] = pColor.g;
      particleColors[i * 3 + 2] = pColor.b;

      particleSpeeds.push({
        radius,
        angle,
        speed: (0.2 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
        yBase: y,
        yAmp: 0.15 + Math.random() * 0.25,
        freq: 0.8 + Math.random() * 1.5
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    handGroup.add(particles);

    // 4. Subtle Soundwave Rings at Fingertips
    const ringGroup = new THREE.Group();
    handGroup.add(ringGroup);

    const ringGeom = new THREE.RingGeometry(0.12, 0.16, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffa439,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });

    const rings = [4, 8, 12, 16, 20].map((tipIdx) => {
      const ring = new THREE.Mesh(ringGeom, ringMat.clone());
      ringGroup.add(ring);
      return { ring, tipIdx, phase: tipIdx * 0.7 };
    });

    // Interaction tracking (mouse / touch)
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-1, Math.min(1, x));
      mouse.targetY = Math.max(-1, Math.min(1, y));
    };

    window.addEventListener('pointermove', handlePointerMove);

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const posAttr = boneGeometry.getAttribute('position');
    const pPosAttr = particleGeometry.getAttribute('position');

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth pointer damping
      mouse.x += (mouse.targetX - mouse.x) * (delta * 4.5);
      mouse.y += (mouse.targetY - mouse.y) * (delta * 4.5);

      // Hand group orientation: natural breathing sway + mouse parallax
      handGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.15 + mouse.x * 0.45;
      handGroup.rotation.x = Math.cos(elapsed * 0.5) * 0.08 - mouse.y * 0.35 + 0.05;
      handGroup.rotation.z = Math.sin(elapsed * 0.4) * 0.05 + mouse.x * 0.1;
      handGroup.position.y = Math.sin(elapsed * 1.2) * 0.08;

      // Animate hand joints (subtle musical finger articulation)
      const currentPositions = [];
      for (let i = 0; i < BASE_HAND_LANDMARKS.length; i++) {
        const base = BASE_HAND_LANDMARKS[i];
        let waveY = 0;
        let waveZ = 0;

        // Fingers flexing in musical cadence
        if ([1, 2, 3, 4].includes(i)) {
          // Thumb
          const t = elapsed * 1.8;
          waveY = Math.sin(t) * 0.08 * (i / 4);
          waveZ = Math.cos(t) * 0.06 * (i / 4);
        } else if ([5, 6, 7, 8].includes(i)) {
          // Index
          const t = elapsed * 2.2 + 0.5;
          waveY = Math.sin(t) * 0.15 * ((i - 4) / 4);
          waveZ = Math.sin(t) * 0.09 * ((i - 4) / 4);
        } else if ([9, 10, 11, 12].includes(i)) {
          // Middle
          const t = elapsed * 2.0 + 1.2;
          waveY = Math.sin(t) * 0.18 * ((i - 8) / 4);
          waveZ = Math.sin(t) * 0.1 * ((i - 8) / 4);
        } else if ([13, 14, 15, 16].includes(i)) {
          // Ring
          const t = elapsed * 2.4 + 2.0;
          waveY = Math.sin(t) * 0.13 * ((i - 12) / 4);
          waveZ = Math.sin(t) * 0.08 * ((i - 12) / 4);
        } else if ([17, 18, 19, 20].includes(i)) {
          // Pinky
          const t = elapsed * 2.6 + 2.8;
          waveY = Math.sin(t) * 0.16 * ((i - 16) / 4);
          waveZ = Math.sin(t) * 0.1 * ((i - 16) / 4);
        }

        const posX = base[0];
        const posY = base[1] + waveY;
        const posZ = base[2] + waveZ;

        currentPositions.push([posX, posY, posZ]);
        nodeSpheres[i].position.set(posX, posY, posZ);
      }

      // Update bone lines
      for (let i = 0; i < BONE_CONNECTIONS.length; i++) {
        const [a, b] = BONE_CONNECTIONS[i];
        const pA = currentPositions[a];
        const pB = currentPositions[b];

        posAttr.setXYZ(i * 2 + 0, pA[0], pA[1], pA[2]);
        posAttr.setXYZ(i * 2 + 1, pB[0], pB[1], pB[2]);
      }
      posAttr.needsUpdate = true;

      // Update fingertip resonance rings
      rings.forEach(({ ring, tipIdx, phase }) => {
        const p = currentPositions[tipIdx];
        ring.position.set(p[0], p[1], p[2]);
        ring.lookAt(camera.position);
        const scale = 1 + (Math.sin(elapsed * 3 + phase) * 0.5 + 0.5) * 0.8;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity = 0.65 - (scale - 1) * 0.6;
      });

      // Animate ambient particles
      for (let i = 0; i < particleCount; i++) {
        const sp = particleSpeeds[i];
        sp.angle += sp.speed * delta;
        const x = Math.cos(sp.angle) * sp.radius;
        const y = sp.yBase + Math.sin(elapsed * sp.freq + sp.angle) * sp.yAmp;
        const z = Math.sin(sp.angle) * (sp.radius * 0.5);
        pPosAttr.setXYZ(i, x, y, z);
      }
      pPosAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();

      jointGeom.dispose();
      fingertipGeom.dispose();
      jointMaterial.dispose();
      tipMaterial.dispose();
      wristMaterial.dispose();
      boneGeometry.dispose();
      boneMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      ringGeom.dispose();
      ringMat.dispose();

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="particle-canvas-wrapper" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div className="canvas-interactive-overlay">
        <div className="interactive-badge">
          <span className="dot-glow" />
          <span>Interactive 3D Landmark Grid</span>
        </div>
      </div>
    </div>
  );
}
