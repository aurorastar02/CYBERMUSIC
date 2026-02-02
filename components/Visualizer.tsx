
import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Float } from '@react-three/drei';
import { Physics, useSphere, useBox } from '@react-three/cannon';
import * as THREE from 'three';

// Define local aliases for R3F intrinsic elements to bypass JSX type errors in environments
// where the global JSX.IntrinsicElements is not properly augmented by @react-three/fiber.
const mesh = 'mesh' as any;
const boxGeometry = 'boxGeometry' as any;
const meshStandardMaterial = 'meshStandardMaterial' as any;
const sphereGeometry = 'sphereGeometry' as any;
const pointLight = 'pointLight' as any;
const color = 'color' as any;
const ambientLight = 'ambientLight' as any;
const spotLight = 'spotLight' as any;
const planeGeometry = 'planeGeometry' as any;
const gridHelper = 'gridHelper' as any;

interface VisualizerProps {
  analyzer: AnalyserNode | null;
  isPlaying: boolean;
}

// 單個音階柱組件
const FrequencyBar = ({ index, total, analyzer }: { index: number, total: number, analyzer: AnalyserNode | null }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 8;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const meshRef = useRef<THREE.Mesh>(null);
  const [hit, setHit] = useState(0);

  // 物理實體（靜態）
  const [ref] = useBox(() => ({
    type: 'Static',
    position: [x, 0, z],
    rotation: [0, -angle, 0],
    args: [0.5, 2, 0.5],
    onCollide: () => setHit(1)
  }));

  useFrame(() => {
    if (!analyzer || !meshRef.current) return;
    
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);
    
    // 對應頻段數據
    const val = dataArray[index % 64] / 255;
    const targetScaleY = 0.5 + val * 10;
    
    // 平滑高度變化
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScaleY, 0.2);
    meshRef.current.position.y = meshRef.current.scale.y / 2;

    // 碰撞閃爍衰減
    if (hit > 0) setHit(h => h * 0.9);
  });

  const hue = (index / total) * 360;
  const colorVal = new THREE.Color(`hsl(${hue}, 80%, 50%)`);

  return (
    <mesh ref={mergeRefs(meshRef, ref)}>
      <boxGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial 
        color={colorVal} 
        emissive={colorVal}
        emissiveIntensity={0.5 + hit * 5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

// 中心物理球組件
const PulseBall = ({ analyzer, isPlaying }: { analyzer: AnalyserNode | null, isPlaying: boolean }) => {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position: [0, 5, 0],
    args: [1.2],
    linearDamping: 0.4,
    angularDamping: 0.4,
  }));

  const lastBassRef = useRef(0);
  const pos = useRef([0, 0, 0]);

  // 訂閱物理位置
  useMemo(() => api.position.subscribe(v => pos.current = v), [api]);

  useFrame(() => {
    if (!analyzer || !isPlaying) return;

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);
    
    // 計算低音平均 (Bass 0-5)
    let bassSum = 0;
    for (let i = 0; i < 5; i++) bassSum += dataArray[i];
    const avgBass = bassSum / 5 / 255;

    // 向心引力：讓球體傾向回到中心
    const strength = 1.5;
    api.applyForce([
      -pos.current[0] * strength,
      (2 - pos.current[1]) * strength, // 懸浮在 Y=2
      -pos.current[2] * strength
    ], [0, 0, 0]);

    // 節拍偵測 (Peak Detection)
    const threshold = 0.15;
    const delta = avgBass - lastBassRef.current;
    
    if (delta > threshold) {
      // 爆炸彈射！隨機方向衝量
      const force = 15 + delta * 20;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      
      api.applyImpulse([
        Math.sin(theta) * Math.cos(phi) * force,
        Math.cos(theta) * force * 0.5,
        Math.sin(theta) * Math.sin(phi) * force
      ], [0, 0, 0]);
    }
    
    lastBassRef.current = avgBass;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial 
        color="#ffffff" 
        emissive="#00f2ff" 
        emissiveIntensity={2}
        metalness={1}
        roughness={0}
      />
      <pointLight intensity={10} color="#00f2ff" distance={10} />
    </mesh>
  );
};

// 輔助函式：合併 Refs
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(value);
      else if (ref) (ref as any).current = value;
    });
  };
}

const Visualizer: React.FC<VisualizerProps> = ({ analyzer, isPlaying }) => {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 15, 20]} fov={50} />
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

        <Physics gravity={[0, -9.81, 0]}>
          {/* 地面 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#0a0a0a" opacity={0.5} transparent />
          </mesh>

          {/* 64 根音階柱 */}
          {Array.from({ length: 64 }).map((_, i) => (
            <FrequencyBar key={i} index={i} total={64} analyzer={analyzer} />
          ))}

          {/* 物理能量球 */}
          <PulseBall analyzer={analyzer} isPlaying={isPlaying} />
        </Physics>

        {/* 背景裝飾 */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <gridHelper args={[100, 50, 0x111111, 0x050505]} position={[0, -0.4, 0]} />
        </Float>

        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={5} 
          maxDistance={40}
        />
      </Canvas>
    </div>
  );
};

export default Visualizer;
