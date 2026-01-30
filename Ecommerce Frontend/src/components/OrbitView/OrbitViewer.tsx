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

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "#3b82f6", // blue
  Fashion: "#ec4899", // pink
  "Sports & Outdoors": "#10b981", // green
  Home: "#f59e0b", // orange
  Books: "#8b5cf6", // purple
  Toys: "#ef4444", // red
  Beauty: "#ec4899", // pink
  Food: "#84cc16", // lime
};

function getCategoryColor(category: string | null): string {
  if (!category) return "#6b7280"; // gray
  return CATEGORY_COLORS[category] || "#6b7280";
}

// Product sphere with hover interaction
function ProductSphere({
  product,
  onHover,
  onUnhover,
  onClick,
}: {
  product: ProductOrbitPoint;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = getCategoryColor(product.category);
  const size = 0.15 + product.similarity_score * 0.15; // Size by similarity

  useFrame(() => {
    if (meshRef.current && hovered) {
      // Subtle pulsing animation on hover
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      meshRef.current.scale.setScalar(scale);
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
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.5 : 0.2}
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  );
}

// Central glowing sun representing the query
function QuerySun() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#fbbf24"
        emissiveIntensity={1.5}
        toneMapped={false}
      />
      {/* Add point light for glow effect */}
      <pointLight intensity={2} distance={15} color="#fbbf24" />
    </mesh>
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

  // Prevent sphere overlap by checking minimum distance
  const processedProducts = useMemo(() => {
    const minDistance = 0.5;
    const products = [...data.products];
    const positions = new Set<string>();

    return products.filter((product) => {
      const key = `${product.position.x.toFixed(1)}_${product.position.y.toFixed(1)}_${product.position.z.toFixed(1)}`;
      if (positions.has(key)) {
        // Slightly offset overlapping products
        product.position.x += (Math.random() - 0.5) * minDistance;
        product.position.y += (Math.random() - 0.5) * minDistance;
        product.position.z += (Math.random() - 0.5) * minDistance;
      }
      positions.add(key);
      return true;
    });
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
            <h2 className="mb-1 text-xl font-bold">🌌 Semantic Orbit View</h2>
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
      <div className="absolute bottom-4 right-4 max-w-xs rounded-lg bg-black/70 p-3 text-xs text-white backdrop-blur-md">
        <h3 className="mb-2 font-semibold">Category Colors</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
