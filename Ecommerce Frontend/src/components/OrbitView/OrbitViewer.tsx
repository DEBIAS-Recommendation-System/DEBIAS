"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";

interface ProductOrbitPoint {
  product_id: number;
  title: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  imgUrl: string | null;
  position: { x: number; y: number; z: number };
  similarity_score: number;
}

interface OrbitViewData {
  query_text: string;
  query_position: { x: number; y: number; z: number };
  total_products: number;
  products: ProductOrbitPoint[];
  dimension_info: {
    original_dimensions: number;
    reduced_dimensions: number;
    method: string;
    centered_at_origin: boolean;
    scale_range?: string;
  };
}

interface OrbitViewerProps {
  data: OrbitViewData;
  onClose: () => void;
}

// Price gradient colors (bronze → silver → gold)
const PRICE_GRADIENT = {
  bronze: { r: 205, g: 127, b: 50 }, // #CD7F32 - low
  silver: { r: 192, g: 192, b: 192 }, // #C0C0C0 - mid
  gold: { r: 255, g: 215, b: 0 }, // #FFD700 - high
};

// Interpolate between two colors
function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number,
): string {
  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Get color based on price percentage (0-1)
function getPriceGradientColor(
  price: number | null,
  minPrice: number,
  maxPrice: number,
): string {
  if (!price || minPrice === maxPrice)
    return lerpColor(PRICE_GRADIENT.bronze, PRICE_GRADIENT.bronze, 0);

  // Calculate percentage (0 to 1)
  const percent = Math.max(
    0,
    Math.min(1, (price - minPrice) / (maxPrice - minPrice)),
  );

  // Two-phase gradient: bronze → silver (0-0.5), silver → gold (0.5-1)
  if (percent < 0.5) {
    return lerpColor(PRICE_GRADIENT.bronze, PRICE_GRADIENT.silver, percent * 2);
  } else {
    return lerpColor(
      PRICE_GRADIENT.silver,
      PRICE_GRADIENT.gold,
      (percent - 0.5) * 2,
    );
  }
}

// Product sphere with hover interaction
// Sphere radius constant for min distance calculation
const SPHERE_RADIUS = 0.3;

function ProductSphere({
  product,
  minPrice,
  maxPrice,
  isTopMatch,
  onHover,
  onUnhover,
  onClick,
}: {
  product: ProductOrbitPoint;
  minPrice: number;
  maxPrice: number;
  isTopMatch: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = getPriceGradientColor(product.price, minPrice, maxPrice);

  // Size influenced by match%: 10% match = 5% bigger, 50% match = 25% bigger
  const matchBonus = product.similarity_score * 0.5; // 0.5x multiplier
  const sphereSize = SPHERE_RADIUS * (1 + matchBonus);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      // Subtle pulsing animation on hover
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
    // Rotate the Saturn ring
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[product.position.x, product.position.y, product.position.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onUnhover();
        document.body.style.cursor = "auto";
        if (meshRef.current) {
          meshRef.current.scale.setScalar(1);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[sphereSize, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.8 : 0.3}
        metalness={0.9}
        roughness={0.2}
        clearcoat={0.5}
        clearcoatRoughness={0.1}
      />

      {/* Saturn ring for top 10% matches */}
      {isTopMatch && (
        <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[sphereSize * 1.4, sphereSize * 2.0, 64]} />
          <meshBasicMaterial
            color="#FFD700"
            side={THREE.DoubleSide}
            transparent={true}
            opacity={0.6}
          />
        </mesh>
      )}
    </mesh>
  );
}

// Central glowing sun representing the query
function QuerySun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      // Outer glow pulsing slightly offset
      const glowScale = 1.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Inner bright core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Glowing aura layer */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent={true}
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshBasicMaterial
          color="#ff8c00"
          transparent={true}
          opacity={0.15}
          toneMapped={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Strong point light for illumination */}
      <pointLight intensity={5} distance={30} color="#fbbf24" decay={2} />
      <pointLight intensity={2} distance={50} color="#ff6600" decay={1} />
    </group>
  );
}

// Camera controller with auto-rotation
function CameraController({ autoRotate }: { autoRotate: boolean }) {
  const controlsRef = useRef<any>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      minDistance={5}
      maxDistance={50}
      onStart={() => {
        // Stop auto-rotate when user interacts
      }}
    />
  );
}

// 3D Product card tooltip
function ProductTooltip({ product }: { product: ProductOrbitPoint }) {
  return (
    <Html
      position={[
        product.position.x,
        product.position.y + 1,
        product.position.z,
      ]}
      center
      style={{
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div className="w-64 overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-2xl">
        {/* Product Image */}
        {product.imgUrl && (
          <div className="relative h-32 bg-gray-100">
            <img
              src={product.imgUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="p-3">
          <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900">
            {product.title}
          </h4>

          {product.brand && (
            <p className="mb-1 text-xs text-gray-500">{product.brand}</p>
          )}
          {product.category && (
            <p className="mb-2 text-xs text-gray-500">{product.category}</p>
          )}

          {/* Price & Score */}
          <div className="flex items-center justify-between">
            {product.price && (
              <span className="text-base font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            )}
            <span className="text-xs font-medium text-blue-600">
              {(product.similarity_score * 100).toFixed(0)}% match
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}

// Main 3D scene
function Scene({ data }: { data: OrbitViewData }) {
  const [hoveredProduct, setHoveredProduct] =
    useState<ProductOrbitPoint | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Calculate min/max price for gradient
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = data.products
      .map((p) => p.price)
      .filter((p): p is number => p !== null && p > 0);
    return {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 1000,
    };
  }, [data.products]);

  // Calculate top 10% threshold for Saturn rings
  const topMatchThreshold = useMemo(() => {
    const scores = data.products
      .map((p) => p.similarity_score)
      .sort((a, b) => b - a);
    const top10Index = Math.max(0, Math.floor(scores.length * 0.1) - 1);
    return scores[top10Index] || 0;
  }, [data.products]);

  // Prevent sphere overlap by checking minimum distance (= sphere diameter)
  const processedProducts = useMemo(() => {
    const minDistance = SPHERE_RADIUS * 2; // Diameter of sphere
    const products = [...data.products];

    // Apply separation to overlapping products
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const dx = products[j].position.x - products[i].position.x;
        const dy = products[j].position.y - products[i].position.y;
        const dz = products[j].position.z - products[i].position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < minDistance && distance > 0) {
          // Push apart
          const overlap = minDistance - distance;
          const factor = overlap / distance / 2;
          products[j].position.x += dx * factor;
          products[j].position.y += dy * factor;
          products[j].position.z += dz * factor;
          products[i].position.x -= dx * factor;
          products[i].position.y -= dy * factor;
          products[i].position.z -= dz * factor;
        }
      }
    }

    return products;
  }, [data.products]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Environment map */}
      <Environment files="/HDR_hazy_nebulae.hdr" background />

      {/* Central query sun */}
      <QuerySun />

      {/* Product spheres */}
      {processedProducts.map((product) => (
        <ProductSphere
          key={product.product_id}
          product={product}
          minPrice={minPrice}
          maxPrice={maxPrice}
          isTopMatch={product.similarity_score >= topMatchThreshold}
          onHover={() => {
            setHoveredProduct(product);
            setAutoRotate(false);
          }}
          onUnhover={() => {
            setHoveredProduct(null);
            setAutoRotate(true);
          }}
          onClick={() => {
            // Open product in new tab or modal
            console.log("Product clicked:", product);
          }}
        />
      ))}

      {/* Tooltip for hovered product */}
      {hoveredProduct && <ProductTooltip product={hoveredProduct} />}

      {/* Camera controls */}
      <CameraController autoRotate={autoRotate} />
    </>
  );
}

// Info panel overlay
function InfoPanel({
  data,
  onClose,
}: {
  data: OrbitViewData;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-10">
      <div className="pointer-events-auto max-w-2xl rounded-lg bg-black/70 p-4 text-white backdrop-blur-md">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="mb-1 text-xl font-bold">🌌 Vectors in Orbit View</h2>
            <p className="text-sm text-gray-300">
              Query: &quot;{data.query_text}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
          >
            Return to Earth ↩
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-400">Products Visualized</p>
            <p className="text-lg font-semibold">{data.total_products}</p>
          </div>
          <div>
            <p className="text-gray-400">Dimensionality Reduction</p>
            <p className="text-lg font-semibold">
              {data.dimension_info.original_dimensions}d →{" "}
              {data.dimension_info.reduced_dimensions}d (
              {data.dimension_info.method})
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          💡 Products closer in space have similar semantic meaning. The golden
          sun at the center represents your search query. Hover over spheres to
          see details, scroll to zoom, drag to rotate.
        </p>
      </div>
    </div>
  );
}

// Loading state
function LoadingView() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center text-white">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-yellow-400"></div>
        <p className="text-xl font-semibold">Launching into orbit...</p>
        <p className="mt-2 text-sm text-gray-400">
          Computing 3D semantic space
        </p>
      </div>
    </div>
  );
}

// Main component
export default function OrbitViewer({ data, onClose }: OrbitViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for dramatic effect
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle ESC key to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Info panel */}
      <InfoPanel data={data} onClose={onClose} />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [15, 15, 15], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene data={data} />
      </Canvas>

      {/* Legend */}
      {(() => {
        const prices = data.products
          .map((p) => p.price)
          .filter((p): p is number => p !== null && p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000;
        const midPrice = (minPrice + maxPrice) / 2;

        return (
          <div className="absolute bottom-4 right-4 w-48 rounded-lg bg-black/70 p-3 text-xs text-white backdrop-blur-md">
            <h3 className="mb-2 font-semibold">Price Range</h3>
            {/* Gradient bar */}
            <div
              className="mb-1 h-4 rounded-lg"
              style={{
                background:
                  "linear-gradient(to right, #CD7F32, #C0C0C0, #FFD700)",
              }}
            />
            {/* Labels */}
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>${minPrice.toFixed(0)}</span>
              <span>${midPrice.toFixed(0)}</span>
              <span>${maxPrice.toFixed(0)}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
