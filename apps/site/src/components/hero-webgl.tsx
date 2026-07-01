'use client';
import { useEffect, useRef } from 'react';

import * as THREE from 'three';

export function HeroWebGL() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.z = 250;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Group for all elements
    const group = new THREE.Group();
    scene.add(group);

    // 1. Grid (Background)
    const gridSize = 800;
    const gridDivisions = 40;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x1e2640, 0x1e2640);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -100;
    gridHelper.material.opacity = 0.04;
    gridHelper.material.transparent = true;
    group.add(gridHelper);

    // 2. Nodes (Points)
    const nodeCount = 24;
    const nodesGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodePhases = new Float32Array(nodeCount); // For subtle pulsing

    for (let i = 0; i < nodeCount; i++) {
      // Scatter nodes mostly horizontally across the screen
      nodePositions[i * 3] = (Math.random() - 0.5) * 400; // x
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 200; // y
      nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
      nodePhases[i] = Math.random() * Math.PI * 2;
    }

    nodesGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    nodesGeometry.setAttribute('phase', new THREE.BufferAttribute(nodePhases, 1));

    // Custom shader for glowing nodes
    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x2563ff) }, // Electric blue
      },
      vertexShader: `
        attribute float phase;
        varying float vPhase;
        void main() {
          vPhase = phase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (12.0 + sin(phase) * 4.0) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying float vPhase;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float pulse = (sin(time * 2.0 + vPhase) * 0.5 + 0.5);
          float alpha = (0.3 / dist - 0.6) * (0.5 + pulse * 0.5);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const nodes = new THREE.Points(nodesGeometry, nodeMaterial);
    group.add(nodes);

    // 3. Connections (Lines)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2563ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    });

    const linesGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    // Connect close nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodePositions[i * 3] - nodePositions[j * 3];
        const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
        const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 120) {
          linePositions.push(
            nodePositions[i * 3],
            nodePositions[i * 3 + 1],
            nodePositions[i * 3 + 2],
            nodePositions[j * 3],
            nodePositions[j * 3 + 1],
            nodePositions[j * 3 + 2]
          );
        }
      }
    }

    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(linesGeometry, lineMaterial);
    group.add(lines);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
      }

      const elapsedTime = clock.getElapsedTime();

      // Update uniforms
      nodeMaterial.uniforms.time.value = elapsedTime;

      // Subtle scene rotation
      if (!prefersReducedMotion) {
        group.rotation.y = Math.sin(elapsedTime * 0.1) * 0.05;
        group.rotation.x = Math.cos(elapsedTime * 0.08) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();

      // Dispose Three.js resources
      nodesGeometry.dispose();
      nodeMaterial.dispose();
      linesGeometry.dispose();
      lineMaterial.dispose();
      gridHelper.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="hero-webgl-canvas" aria-hidden="true" />;
}
