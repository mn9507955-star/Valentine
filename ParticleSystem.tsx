
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ShapeType = 'sphere' | 'heart' | 'rose' | 'text1' | 'text2';

interface ParticleSystemProps {
  active: boolean;
  shape: ShapeType;
  handPos: THREE.Vector3;
  handActive: boolean;
}

const PARTICLE_COUNT = 30000;

const ParticleSystem: React.FC<ParticleSystemProps> = ({ active, shape, handPos, handActive }) => {
  const meshRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const sampleText = (text: string, fontSize: number, maxWidth: number, isParagraph: boolean) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Float32Array(PARTICLE_COUNT * 3);

    canvas.width = 1024; canvas.height = 512;
    ctx.fillStyle = 'black'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    
    if (!isParagraph) {
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    } else {
      ctx.font = `${fontSize}px Arial, sans-serif`;
      const words = text.split(' ');
      let line = '', y = canvas.height / 2 - 60, lineHeight = fontSize + 10;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + ' '; y += lineHeight;
        } else line = testLine;
      }
      ctx.fillText(line, canvas.width / 2, y);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixels = [];
    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        if (imageData[(y * canvas.width + x) * 4] > 128) {
          pixels.push({ x: (x - canvas.width / 2) * 0.08, y: (canvas.height / 2 - y) * 0.08, z: (Math.random() - 0.5) * 2 });
        }
      }
    }

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = pixels[i % pixels.length];
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
    }
    return positions;
  };

  const { spherePos, heartPos, rosePos, text1Pos, text2Pos, randoms } = useMemo(() => {
    const sphere = new Float32Array(PARTICLE_COUNT * 3);
    const heart = new Float32Array(PARTICLE_COUNT * 3);
    const rose = new Float32Array(PARTICLE_COUNT * 3);
    const rand = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      sphere[i * 3] = 12 * Math.cos(theta) * Math.sin(phi);
      sphere[i * 3 + 1] = 12 * Math.sin(theta) * Math.sin(phi);
      sphere[i * 3 + 2] = 12 * Math.cos(phi);

      const tH = Math.random() * Math.PI * 2, pH = (Math.random() - 0.5) * 2;
      heart[i * 3] = 16 * Math.pow(Math.sin(tH), 3) * 0.7;
      heart[i * 3 + 1] = (13 * Math.cos(tH) - 5 * Math.cos(2 * tH) - 2 * Math.cos(3 * tH) - Math.cos(4 * tH)) * 0.7;
      heart[i * 3 + 2] = pH * (8 + 8 * Math.abs(Math.sin(tH))) * 0.4;

      const tR = Math.random() * Math.PI * 10, pR = Math.random() * Math.PI, k = 4.0;
      const rR = 15.0 * Math.cos(k * tR) * Math.sin(pR);
      rose[i * 3] = rR * Math.sin(pR) * Math.cos(tR);
      rose[i * 3 + 1] = rR * Math.sin(pR) * Math.sin(tR);
      rose[i * 3 + 2] = rR * Math.cos(pR) + (Math.sin(tR * 2.0) * 2.0);

      rand[i] = Math.random();
    }
    return { spherePos: sphere, heartPos: heart, rosePos: rose, text1Pos: sampleText('Valentine vui vẻ', 120, 800, false), text2Pos: sampleText('Hôm nay là ngày 14/2 chúc cho các bạn luôn vui vẻ hạnh phúc...', 40, 700, true), randoms: rand };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uActive: { value: 0 },
    uShapeWeights: { value: [1, 0, 0, 0, 0] },
    uHandPos: { value: new THREE.Vector3() },
    uHandActive: { value: 0.0 }
  }), []);

  useEffect(() => { if (active) uniforms.uActive.value = 1.0; }, [active, uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uHandPos.value.lerp(handPos, 0.1);
    uniforms.uHandActive.value = THREE.MathUtils.lerp(uniforms.uHandActive.value, handActive ? 1.0 : 0.0, 0.1);
    
    const targetWeights = [0, 0, 0, 0, 0];
    const shapeIdx = ['sphere', 'heart', 'rose', 'text1', 'text2'].indexOf(shape);
    if (shapeIdx !== -1) targetWeights[shapeIdx] = 1;

    for (let i = 0; i < 5; i++) {
      uniforms.uShapeWeights.value[i] = THREE.MathUtils.lerp(uniforms.uShapeWeights.value[i], targetWeights[i], 0.05);
    }
  });

  const vertexShader = `
    uniform float uTime;
    uniform float uActive;
    uniform float uShapeWeights[5];
    uniform vec3 uHandPos;
    uniform float uHandActive;
    
    attribute vec3 aHeart;
    attribute vec3 aRose;
    attribute vec3 aText1;
    attribute vec3 aText2;
    attribute float aRandom;
    
    varying vec3 vColor;

    void main() {
      vec3 targetPos = position * uShapeWeights[0] + aHeart * uShapeWeights[1] + aRose * uShapeWeights[2] + aText1 * uShapeWeights[3] + aText2 * uShapeWeights[4];
      
      // Hand Interaction (Repulsion)
      if (uHandActive > 0.1) {
        float dist = distance(targetPos, uHandPos);
        if (dist < 10.0) {
          float force = (1.0 - dist / 10.0) * 5.0;
          targetPos += normalize(targetPos - uHandPos) * force;
        }
      }

      targetPos.x += sin(uTime + aRandom * 10.0) * 0.1;
      targetPos.y += cos(uTime * 0.8 + aRandom * 10.0) * 0.1;

      vec4 mvPosition = modelViewMatrix * vec4(targetPos, 1.0);
      
      vec3 colorSphere = vec3(0.0, 1.0, 1.0);
      vec3 colorHeart = vec3(1.0, 0.1, 0.3);
      vec3 colorRose = vec3(1.0, 0.1, 0.1);
      vec3 colorText = vec3(1.0, 0.9, 0.5);

      vColor = colorSphere * uShapeWeights[0] + colorHeart * uShapeWeights[1] + colorRose * uShapeWeights[2] + (colorText * (uShapeWeights[3] + uShapeWeights[4]));
      
      gl_PointSize = (2.0 + aRandom * 2.0) * (300.0 / -mvPosition.z) * uActive;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      if (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(vColor, (1.0 - distance(gl_PointCoord, vec2(0.5)) * 2.0) * 0.8);
    }
  `;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={spherePos} itemSize={3} />
        <bufferAttribute attach="attributes-aHeart" count={PARTICLE_COUNT} array={heartPos} itemSize={3} />
        <bufferAttribute attach="attributes-aRose" count={PARTICLE_COUNT} array={rosePos} itemSize={3} />
        <bufferAttribute attach="attributes-aText1" count={PARTICLE_COUNT} array={text1Pos} itemSize={3} />
        <bufferAttribute attach="attributes-aText2" count={PARTICLE_COUNT} array={text2Pos} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={PARTICLE_COUNT} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </points>
  );
};

export default ParticleSystem;
