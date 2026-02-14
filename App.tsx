
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import ParticleSystem, { ShapeType } from './components/ParticleSystem';
import Overlay from './components/Overlay';
import PostProcessing from './components/PostProcessing';

// Gestures detection logic
const getDistance = (p1: any, p2: any) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [shape, setShape] = useState<ShapeType>('sphere');
  const [handPos, setHandPos] = useState(new THREE.Vector3(0, 0, 0));
  const [handActive, setHandActive] = useState(false);
  const [gesture, setGesture] = useState('Đang chờ tay...');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);

  useEffect(() => {
    if (!started) return;

    const setupHands = async () => {
      // @ts-ignore
      const { Hands } = window;
      if (!Hands) return;

      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          setHandActive(true);

          // Interaction point: Index Finger Tip (Landmark 8)
          // Map camera coordinates (0 to 1) to 3D world space
          const indexTip = landmarks[8];
          const worldX = (0.5 - indexTip.x) * 60;
          const worldY = (0.5 - indexTip.y) * 40;
          setHandPos(new THREE.Vector3(worldX, worldY, 0));

          // Gesture Logic
          const thumbTip = landmarks[4];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];
          const wrist = landmarks[0];

          const distIndex = getDistance(indexTip, wrist);
          const distMiddle = getDistance(middleTip, wrist);
          const distRing = getDistance(ringTip, wrist);
          const distPinky = getDistance(pinkyTip, wrist);
          
          const isFist = distIndex < 0.2 && distMiddle < 0.2 && distRing < 0.2;
          const isOpen = distIndex > 0.4 && distMiddle > 0.4 && distRing > 0.4;
          const isHeart = getDistance(thumbTip, indexTip) < 0.05;

          if (isHeart) {
            setShape('heart');
            setGesture('❤️ TRÁI TIM');
          } else if (isFist) {
            setShape('rose');
            setGesture('🌹 HOA HỒNG');
          } else if (isOpen) {
            setShape('text1');
            setGesture('✨ THÔNG ĐIỆP');
          }
        } else {
          setHandActive(false);
          setGesture('Không thấy tay');
        }
      });

      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          const detect = async () => {
            if (videoRef.current) {
              await hands.send({ image: videoRef.current });
            }
            requestAnimationFrame(detect);
          };
          detect();
        };
      }
      handsRef.current = hands;
    };

    setupHands();
    return () => {
      if (handsRef.current) handsRef.current.close();
    };
  }, [started]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {!started && <Overlay onStart={() => setStarted(true)} />}
      
      {started && (
        <>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center">
             <div className="px-6 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white font-bold tracking-widest shadow-xl animate-pulse">
                {gesture}
             </div>
             <div className="mt-2 text-[10px] text-white/40 uppercase tracking-widest">
                Xòe tay: Chữ | Nắm tay: Hoa | Chạm ngón: Tim
             </div>
          </div>
          
          {/* Hidden Video for MediaPipe */}
          <video 
            ref={videoRef} 
            className="hidden" 
            playsInline 
            muted 
          />
        </>
      )}

      <Canvas gl={{ antialias: false }} dpr={[1, 2]}>
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[0, 0, 45]} fov={45} />
        <Suspense fallback={null}>
          <ParticleSystem active={started} shape={shape} handPos={handPos} handActive={handActive} />
          <PostProcessing />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={true} minDistance={20} maxDistance={100} />
      </Canvas>
    </div>
  );
};

export default App;
