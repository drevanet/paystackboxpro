"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";

export type FaceImages = {
  front: string | null;
  back: string | null;
  left: string | null;
  right: string | null;
  top: string | null;
  bottom: string | null;
};

function Box({ images, scale }: { images: FaceImages; scale: number }) {
  const [textures, setTextures] = useState<Record<string, THREE.Texture>>({});

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const next: Record<string, THREE.Texture> = {};
    let pending = 0;

    for (const [face, src] of Object.entries(images)) {
      if (!src) continue;
      pending++;
      loader.load(src, texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        next[face] = texture;
        pending--;
        if (pending === 0) setTextures({ ...next });
      });
    }

    if (pending === 0) setTextures({});
    return () => Object.values(next).forEach(t => t.dispose());
  }, [images]);

  const material = (face: keyof FaceImages) => (
    <meshStandardMaterial map={textures[face]} color={textures[face] ? "white" : "#e5e7eb"} roughness={0.55} />
  );

  return (
    <group scale={[scale, scale, scale]} rotation={[0, -0.42, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.8, 3.6, 1.35]} />
        {material("right")}{material("left")}{material("top")}{material("bottom")}{material("front")}{material("back")}
      </mesh>
    </group>
  );
}

function Scene({ images, scale }: { images: FaceImages; scale: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor("#111827", 1);
  }, [gl]);

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[4, 7, 6]} intensity={2.4} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} />
      <Box images={images} scale={scale} />
      <Environment preset="studio" />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={10} />
    </>
  );
}

export default function BoxScene({ images, scale }: { images: FaceImages; scale: number }) {
  return (
    <Canvas
      shadows
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [5, 3.5, 5], fov: 42 }}
      className="h-full w-full"
    >
      <Scene images={images} scale={scale} />
    </Canvas>
  );
}
