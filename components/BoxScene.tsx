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

type FaceProps = {
  image: string | null;
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
};

function ArtworkFace({
  image,
  position,
  rotation,
  width,
  height,
}: FaceProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    setTexture(null);

    if (!image) {
      return;
    }

    const loader = new THREE.TextureLoader();

    loader.load(
      image,
      (loadedTexture) => {
        if (cancelled) {
          loadedTexture.dispose();
          return;
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;

        loadedTexture.wrapS =
          THREE.ClampToEdgeWrapping;

        loadedTexture.wrapT =
          THREE.ClampToEdgeWrapping;

        loadedTexture.minFilter =
          THREE.LinearFilter;

        loadedTexture.magFilter =
          THREE.LinearFilter;

        loadedTexture.anisotropy = 8;
        loadedTexture.needsUpdate = true;

        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        if (!cancelled) {
          console.error(
            "Artwork texture failed to load:",
            error
          );
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [image]);

  return (
    <mesh
      position={position}
      rotation={rotation}
      renderOrder={10}
    >
      <planeGeometry args={[width, height]} />

      <meshBasicMaterial
        map={texture || undefined}
        color={texture ? "#ffffff" : "#d1d5db"}
        side={THREE.DoubleSide}
        transparent={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Box({
  images,
  scale,
}: {
  images: FaceImages;
  scale: number;
}) {
  const width = 2.8;
  const height = 3.6;
  const depth = 1.35;

  const x = width / 2;
  const y = height / 2;
  const z = depth / 2;

  const offset = 0.02;

  return (
    <group
      scale={[scale, scale, scale]}
      rotation={[0, -0.42, 0]}
    >
      {/* Main box */}

      <mesh castShadow receiveShadow>
        <boxGeometry
          args={[width, height, depth]}
        />

        <meshStandardMaterial
          color="#e5e7eb"
          roughness={0.55}
          metalness={0}
        />
      </mesh>

      {/* FRONT */}

      <ArtworkFace
        image={images.front}
        position={[0, 0, z + offset]}
        rotation={[0, 0, 0]}
        width={width}
        height={height}
      />

      {/* BACK */}

      <ArtworkFace
        image={images.back}
        position={[0, 0, -z - offset]}
        rotation={[0, Math.PI, 0]}
        width={width}
        height={height}
      />

      {/* RIGHT */}

      <ArtworkFace
        image={images.right}
        position={[x + offset, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={depth}
        height={height}
      />

      {/* LEFT */}

      <ArtworkFace
        image={images.left}
        position={[-x - offset, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={depth}
        height={height}
      />

      {/* TOP */}

      <ArtworkFace
        image={images.top}
        position={[0, y + offset, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={width}
        height={depth}
      />

      {/* BOTTOM */}

      <ArtworkFace
        image={images.bottom}
        position={[0, -y - offset, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        width={width}
        height={depth}
      />
    </group>
  );
}

function Scene({
  images,
  scale,
}: {
  images: FaceImages;
  scale: number;
}) {
  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor("#111827", 1);
  }, [gl]);

  return (
    <>
      <ambientLight intensity={1.8} />

      <directionalLight
        position={[5, 8, 6]}
        intensity={2.5}
        castShadow
      />

      <directionalLight
        position={[-5, 3, -4]}
        intensity={1.2}
      />

      <Box
        images={images}
        scale={scale}
      />

      <Environment preset="studio" />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={10}
      />
    </>
  );
}

export default function BoxScene({
  images,
  scale,
}: {
  images: FaceImages;
  scale: number;
}) {
  return (
    <Canvas
      shadows
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
      }}
      camera={{
        position: [5, 3.5, 5],
        fov: 42,
      }}
      className="h-full w-full"
    >
      <Scene
        images={images}
        scale={scale}
      />
    </Canvas>
  );
}