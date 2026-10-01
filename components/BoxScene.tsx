"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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

type BoxSceneProps = {
  images: FaceImages;
  scale: number;
  background: string;
};

const WIDTH = 2.8;
const HEIGHT = 3.6;
const DEPTH = 1.35;

/*
 * Load one image into one Three.js texture.
 */
function loadImageTexture(
  src: string | null
): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();

    image.onload = () => {
      const texture = new THREE.Texture(image);

      texture.colorSpace =
        THREE.SRGBColorSpace;

      texture.minFilter =
        THREE.LinearFilter;

      texture.magFilter =
        THREE.LinearFilter;

      texture.wrapS =
        THREE.ClampToEdgeWrapping;

      texture.wrapT =
        THREE.ClampToEdgeWrapping;

      texture.generateMipmaps = false;

      texture.needsUpdate = true;

      resolve(texture);
    };

    image.onerror = (error) => {
      console.error(
        "Could not load face image:",
        error
      );

      resolve(null);
    };

    image.src = src;
  });
}

/*
 * Creates one material for every face.
 *
 * IMPORTANT:
 *
 * BoxGeometry material indexes:
 *
 * 0 = right
 * 1 = left
 * 2 = top
 * 3 = bottom
 * 4 = front
 * 5 = back
 */
function useBoxMaterials(images: FaceImages) {
  const [materials, setMaterials] =
    useState<
      THREE.MeshStandardMaterial[] | null
    >(null);

  useEffect(() => {
    let cancelled = false;

    async function createMaterials() {
      /*
       * Load each face independently.
       */
      const [
        rightTexture,
        leftTexture,
        topTexture,
        bottomTexture,
        frontTexture,
        backTexture,
      ] = await Promise.all([
        loadImageTexture(images.right),
        loadImageTexture(images.left),
        loadImageTexture(images.top),
        loadImageTexture(images.bottom),
        loadImageTexture(images.front),
        loadImageTexture(images.back),
      ]);

      if (cancelled) {
        [
          rightTexture,
          leftTexture,
          topTexture,
          bottomTexture,
          frontTexture,
          backTexture,
        ].forEach((texture) => {
          texture?.dispose();
        });

        return;
      }

      /*
       * Create SIX completely independent materials.
       */
      const nextMaterials = [
        new THREE.MeshStandardMaterial({
          map: rightTexture ?? undefined,
          color: rightTexture
            ? "#ffffff"
            : "#d5d9df",
          roughness: 0.55,
          metalness: 0,
        }),

        new THREE.MeshStandardMaterial({
          map: leftTexture ?? undefined,
          color: leftTexture
            ? "#ffffff"
            : "#d5d9df",
          roughness: 0.55,
          metalness: 0,
        }),

        new THREE.MeshStandardMaterial({
          map: topTexture ?? undefined,
          color: topTexture
            ? "#ffffff"
            : "#d5d9df",
          roughness: 0.55,
          metalness: 0,
        }),

        new THREE.MeshStandardMaterial({
          map: bottomTexture ?? undefined,
          color: bottomTexture
            ? "#ffffff"
            : "#d5d9df",
          roughness: 0.55,
          metalness: 0,
        }),

        new THREE.MeshStandardMaterial({
          map: frontTexture ?? undefined,
          color: frontTexture
            ? "#ffffff"
            : "#d5d9df",
          roughness: 0.55,
          metalness: 0,
        }),

        new THREE.MeshStandardMaterial({
          map: backTexture ?? undefined,
          color: backTexture
            ? "#ffffff"
            : "#d5d9df",
          roughness: 0.55,
          metalness: 0,
        }),
      ];

      /*
       * Make sure textures are ready.
       */
      nextMaterials.forEach((material) => {
        material.needsUpdate = true;
      });

      setMaterials(nextMaterials);
    }

    createMaterials();

    return () => {
      cancelled = true;
    };
  }, [
    images.front,
    images.back,
    images.left,
    images.right,
    images.top,
    images.bottom,
  ]);

  /*
   * Dispose old materials/textures.
   */
  useEffect(() => {
    return () => {
      if (!materials) return;

      materials.forEach((material) => {
        material.map?.dispose();
        material.dispose();
      });
    };
  }, [materials]);

  return materials;
}

function Box({
  images,
  scale,
}: {
  images: FaceImages;
  scale: number;
}) {
  const materials =
    useBoxMaterials(images);

  if (!materials) {
    return (
      <mesh
        scale={[
          scale,
          scale,
          scale,
        ]}
        rotation={[
          0,
          -0.42,
          0,
        ]}
      >
        <boxGeometry
          args={[
            WIDTH,
            HEIGHT,
            DEPTH,
          ]}
        />

        <meshStandardMaterial
          color="#d5d9df"
          roughness={0.55}
        />
      </mesh>
    );
  }

  return (
    <mesh
      scale={[
        scale,
        scale,
        scale,
      ]}
      rotation={[
        0,
        -0.42,
        0,
      ]}
      castShadow
      receiveShadow
      material={materials}
    >
      <boxGeometry
        args={[
          WIDTH,
          HEIGHT,
          DEPTH,
        ]}
      />
    </mesh>
  );
}

function Scene({
  images,
  scale,
  background,
}: BoxSceneProps) {
  return (
    <>
      <color
        attach="background"
        args={[background]}
      />

      <ambientLight
        intensity={1.8}
      />

      <directionalLight
        position={[
          5,
          7,
          6,
        ]}
        intensity={2.5}
      />

      <directionalLight
        position={[
          -5,
          4,
          -4,
        ]}
        intensity={1.2}
      />

      <Box
        images={images}
        scale={scale}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={10}
        target={[
          0,
          0,
          0,
        ]}
      />
    </>
  );
}

export default function BoxScene({
  images,
  scale,
  background,
}: BoxSceneProps) {
  return (
    <Canvas
      camera={{
        position: [
          5,
          4,
          6,
        ],
        fov: 42,
      }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
      }}
      dpr={[1, 2]}
    >
      <Scene
        images={images}
        scale={scale}
        background={background}
      />
    </Canvas>
  );
}