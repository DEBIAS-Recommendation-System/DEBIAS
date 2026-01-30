"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";

// ============================================
// TYPES
// ============================================

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

// ============================================
// CONSTANTS
// ============================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

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

// Sphere radius constant
const SPHERE_RADIUS = 0.3;

// ============================================
// 3D COMPONENTS
// ============================================

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

function QuerySun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
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

      {/* Strong point lights */}
      <pointLight intensity={5} distance={30} color="#fbbf24" decay={2} />
      <pointLight intensity={2} distance={50} color="#ff6600" decay={1} />
    </group>
  );
}

function CameraController({ autoRotate }: { autoRotate: boolean }) {
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      minDistance={5}
      maxDistance={50}
    />
  );
}

function ProductTooltip({ product }: { product: ProductOrbitPoint }) {
  return (
    <Html
      position={[
        product.position.x,
        product.position.y + 1,
        product.position.z,
      ]}
      center
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div
        style={{
          width: "256px",
          overflow: "hidden",
          borderRadius: "8px",
          border: "2px solid #e5e7eb",
          backgroundColor: "white",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {product.imgUrl && (
          <div
            style={{
              position: "relative",
              height: "128px",
              backgroundColor: "#f3f4f6",
            }}
          >
            <img
              src={product.imgUrl}
              alt={product.title}
              style={{ height: "100%", width: "100%", objectFit: "cover" }}
            />
          </div>
        )}
        <div style={{ padding: "12px" }}>
          <h4
            style={{
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {product.title}
          </h4>
          {product.brand && (
            <p
              style={{
                marginBottom: "4px",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              {product.brand}
            </p>
          )}
          {product.category && (
            <p
              style={{
                marginBottom: "8px",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              {product.category}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {product.price && (
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                ${product.price.toFixed(2)}
              </span>
            )}
            <span
              style={{ fontSize: "12px", fontWeight: "500", color: "#2563eb" }}
            >
              {(product.similarity_score * 100).toFixed(0)}% match
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}

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
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment files="/HDR_hazy_nebulae.hdr" background />
      <QuerySun />

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
            console.log("Product clicked:", product);
            window.open(`/products/${product.product_id}`, "_blank");
          }}
        />
      ))}

      {hoveredProduct && <ProductTooltip product={hoveredProduct} />}
      <CameraController autoRotate={autoRotate} />
    </>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function OrbitTestPage() {
  const [query, setQuery] = useState("laptop");
  const [limit, setLimit] = useState(50);
  const [data, setData] = useState<OrbitViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScene, setShowScene] = useState(false);

  const fetchOrbitData = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/recommendations/orbit-view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query_text: query.trim(),
            limit: limit,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const orbitData: OrbitViewData = await response.json();
      setData(orbitData);
      setShowScene(true);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch orbit data",
      );
    } finally {
      setLoading(false);
    }
  };

  // ESC to close scene
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showScene) {
        setShowScene(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showScene]);

  // Render 3D scene fullscreen
  if (showScene && data) {
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "black" }}>
        {/* Info panel */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(12px)",
              padding: "16px",
              color: "white",
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "4px",
                  }}
                >
                  🌌 Vectors in Orbit View
                </h2>
                <p style={{ fontSize: "14px", color: "#d1d5db" }}>
                  Query: &quot;{data.query_text}&quot;
                </p>
              </div>
              <button
                onClick={() => setShowScene(false)}
                style={{
                  marginLeft: "16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Return to Earth ↩
              </button>
            </div>

            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
                fontSize: "12px",
              }}
            >
              <div>
                <p style={{ color: "#9ca3af" }}>Products Visualized</p>
                <p style={{ fontSize: "18px", fontWeight: "600" }}>
                  {data.total_products}
                </p>
              </div>
              <div>
                <p style={{ color: "#9ca3af" }}>Dimensionality Reduction</p>
                <p style={{ fontSize: "18px", fontWeight: "600" }}>
                  {data.dimension_info.original_dimensions}d →{" "}
                  {data.dimension_info.reduced_dimensions}d (
                  {data.dimension_info.method})
                </p>
              </div>
            </div>

            <p
              style={{ marginTop: "12px", fontSize: "12px", color: "#9ca3af" }}
            >
              💡 Products closer in space have similar semantic meaning. The
              golden sun at the center represents your search query. Hover over
              spheres to see details, scroll to zoom, drag to rotate. Press ESC
              to exit.
            </p>
          </div>
        </div>

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
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                maxWidth: "200px",
                borderRadius: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(12px)",
                padding: "12px",
                color: "white",
                fontSize: "12px",
              }}
            >
              <h3 style={{ fontWeight: "600", marginBottom: "8px" }}>
                Price Range
              </h3>
              {/* Gradient bar */}
              <div
                style={{
                  height: "16px",
                  borderRadius: "8px",
                  background:
                    "linear-gradient(to right, #CD7F32, #C0C0C0, #FFD700)",
                  marginBottom: "6px",
                }}
              />
              {/* Labels */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "#9ca3af",
                }}
              >
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

  // Render control panel
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1f2937 0%, #4c1d95 50%, #1e3a8a 100%)",
        padding: "32px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            color: "white",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          🌌 Orbit View Test
        </h1>
        <p
          style={{
            color: "#d1d5db",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Test the 3D semantic space visualization
        </p>

        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          {/* Query input */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "white",
                marginBottom: "8px",
              }}
            >
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrbitData()}
              placeholder="Enter search query (e.g., laptop, running shoes)"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          {/* Limit slider */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "white",
                marginBottom: "8px",
              }}
            >
              Number of Products: {limit}
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                color: "#fca5a5",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Launch button */}
          <button
            onClick={fetchOrbitData}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "8px",
              background: loading
                ? "#6b7280"
                : "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
              color: "white",
              fontSize: "18px",
              fontWeight: "700",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s",
            }}
          >
            {loading ? (
              <span>🔄 Loading...</span>
            ) : (
              <span>🚀 Launch Into Orbit</span>
            )}
          </button>

          {/* API info */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "white",
                marginBottom: "8px",
              }}
            >
              API Endpoint
            </h3>
            <code
              style={{
                display: "block",
                fontSize: "12px",
                color: "#a5b4fc",
                wordBreak: "break-all",
              }}
            >
              POST {API_BASE_URL}/recommendations/orbit-view
            </code>
            <pre
              style={{
                marginTop: "8px",
                fontSize: "11px",
                color: "#9ca3af",
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify({ query_text: query, limit: limit }, null, 2)}
            </pre>
          </div>

          {/* Controls info */}
          <div
            style={{ marginTop: "24px", color: "#9ca3af", fontSize: "13px" }}
          >
            <h3
              style={{ fontWeight: "600", color: "white", marginBottom: "8px" }}
            >
              3D Controls
            </h3>
            <ul
              style={{
                listStyleType: "disc",
                paddingLeft: "20px",
                lineHeight: "1.6",
              }}
            >
              <li>Drag to rotate</li>
              <li>Scroll to zoom</li>
              <li>Right-click drag to pan</li>
              <li>Hover over spheres for product details</li>
              <li>Click sphere to open product page</li>
              <li>Press ESC to exit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
