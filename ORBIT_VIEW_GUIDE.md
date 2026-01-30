# 🌌 Semantic Orbit Visualization - Setup & Usage Guide

## Overview

The "Launch Into Orbit" feature transforms your ordinary e-commerce search results into an interactive 3D visualization of the semantic space powered by Qdrant vector embeddings. Products float as spheres in 3D space, positioned by their semantic similarity using UMAP dimensionality reduction (512d → 3d).

## Architecture

### Backend (FastAPI)

- **Qdrant Service**: Retrieves 512-dimensional CLIP embeddings from vector database
- **UMAP Reduction**: Reduces embeddings to 3D coordinates centered at origin
- **Orbit View API**: `/recommendations/orbit-view` endpoint returns products with 3D positions

### Frontend (Next.js + Three.js)

- **React Three Fiber**: Renders 3D scene with WebGL
- **OrbitViewer Component**: Interactive 3D visualization with auto-rotation
- **Product Spheres**: Color-coded by category, sized by similarity score
- **Central Sun**: Glowing sphere representing search query at origin (0,0,0)

## Installation

### Backend Dependencies

```bash
cd "Ecommerce-API"
pip install umap-learn
```

Or install from requirements.txt:

```bash
pip install -r requirements.txt
```

### Frontend Dependencies

```bash
cd "Ecommerce Frontend"
pnpm install
# This will install:
# - @react-three/fiber (React renderer for Three.js)
# - @react-three/drei (useful R3F helpers)
# - three (3D graphics library)
# - @types/three (TypeScript definitions)
```

## Usage

### For End Users

1. **Search for products** using the normal search interface
2. **Click "🚀 Launch Into Orbit"** button that appears with search results
3. **Wait for launch animation** (~1.5 seconds) while 3D space is computed
4. **Explore the semantic space**:
   - **Drag** to rotate the view
   - **Scroll** to zoom in/out
   - **Hover** over spheres to see product details
   - **Click** spheres to view product (feature to be implemented)
5. **Exit** by pressing `ESC` or clicking "Return to Earth ↩"

### Visual Guide

- **Golden Sun** (center): Your search query position
- **Colored Spheres**: Products positioned by semantic similarity
  - **Closer to sun** = More similar to your query
  - **Clustered together** = Semantically similar to each other
  - **Size** = Similarity score (larger = more relevant)
  - **Color** = Product category

#### Category Colors

- 🔵 Electronics: Blue
- 💗 Fashion: Pink
- 🟢 Sports & Outdoors: Green
- 🟠 Home: Orange
- 🟣 Books: Purple
- 🔴 Toys: Red
- 💗 Beauty: Pink
- 🟢 Food: Lime

## API Reference

### POST /recommendations/orbit-view

Request:

```json
{
  "query_text": "comfortable running shoes",
  "limit": 150,
  "filters": {
    "category": "Sports & Outdoors"
  }
}
```

Response:

```json
{
  "query_text": "comfortable running shoes",
  "query_position": { "x": 0.0, "y": 0.0, "z": 0.0 },
  "total_products": 150,
  "products": [
    {
      "product_id": 12345,
      "title": "Nike Air Zoom Pegasus 38",
      "brand": "Nike",
      "category": "Sports & Outdoors",
      "price": 119.99,
      "imgUrl": "https://example.com/image.jpg",
      "position": { "x": 2.45, "y": -1.32, "z": 3.87 },
      "similarity_score": 0.89
    }
  ],
  "dimension_info": {
    "original_dimensions": 512,
    "reduced_dimensions": 3,
    "method": "UMAP",
    "centered_at_origin": true,
    "scale_range": "±10 units"
  }
}
```

## Technical Details

### Dimensionality Reduction

**UMAP Parameters:**

- `n_components`: 3 (x, y, z coordinates)
- `n_neighbors`: 15 (balances local vs global structure)
- `min_dist`: 0.1 (controls cluster tightness)
- `metric`: "cosine" (matches Qdrant similarity metric)
- `random_state`: 42 (for reproducibility)

**Normalization:**

1. Apply UMAP to 512d CLIP embeddings
2. Subtract center of mass from all coordinates
3. Scale to ±10 unit range for optimal viewing

### Performance Optimizations

1. **Server-side reduction**: UMAP runs on backend for better performance
2. **Minimum distance enforcement**: Prevents sphere overlap
3. **Dynamic LOD**: Could be added for 1000+ products
4. **WebGL rendering**: Hardware-accelerated 3D graphics
5. **Auto-rotation pause**: Stops on user interaction

### Browser Compatibility

- ✅ Chrome/Edge (Chromium) - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support (macOS/iOS)
- ⚠️ Mobile - Limited (3D performance may vary)

**Minimum Requirements:**

- WebGL 2.0 support
- Modern browser (released within last 2 years)
- Recommended: Discrete GPU for 200+ products

## Troubleshooting

### Backend Issues

**Error: "umap-learn not installed"**

```bash
pip install umap-learn
```

**Error: "Not enough products to create 3D visualization"**

- Requires minimum 2 products for UMAP
- Try broader search query or remove filters

**Error: "Failed to retrieve product vectors"**

- Ensure Qdrant is running and connected
- Verify products have embeddings in collection
- Check `QDRANT_COLLECTION_NAME` environment variable

### Frontend Issues

**Error: "Module not found: Can't resolve 'three'"**

```bash
cd "Ecommerce Frontend"
pnpm install three @react-three/fiber @react-three/drei @types/three
```

**Black screen or no 3D view**

- Check browser console for WebGL errors
- Verify HDR file exists at `/public/HDR_hazy_nebulae.hdr`
- Try disabling browser extensions (ad blockers)

**Performance issues (lag, stuttering)**

- Reduce `limit` parameter in orbit view request
- Close other GPU-intensive applications
- Update graphics drivers

## Configuration

### Environment Variables

**Backend** (`.env`):

```env
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=products
```

**Frontend** (`.env.local`):

```env
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

### Customization

**Adjust number of products visualized:**

```typescript
// In DebiasSearch.tsx
const data = await recommendationsApi.getOrbitView({
  query_text: query.trim(),
  limit: 150, // Change this (10-500)
});
```

**Change category colors:**

```typescript
// In OrbitViewer.tsx
const CATEGORY_COLORS: Record<string, string> = {
  Electronics: "#3b82f6", // Customize colors
  Fashion: "#ec4899",
  // ...
};
```

**Adjust UMAP parameters:**

```python
# In app/services/qdrant_service.py
coordinates_3d = qdrant_service.reduce_dimensions_umap(
    vectors=vectors,
    n_components=3,
    n_neighbors=15,  # Adjust structure (5-50)
    min_dist=0.1,    # Adjust clustering (0.0-1.0)
    metric="cosine"
)
```

## Future Enhancements

- [ ] Add Neo4j behavioral edges (co-purchase relationships)
- [ ] Click product sphere to open detail modal
- [ ] Add cluster labels using K-means
- [ ] Pre-compute and cache popular queries
- [ ] Add VR mode for immersive exploration
- [ ] Animate transitions between different queries
- [ ] Add search history "playback" mode
- [ ] Export 3D view as image/video

## Educational Features

The orbit view includes an info panel explaining:

- Total products visualized
- Dimensionality reduction method (512d → 3d UMAP)
- How to interpret spatial relationships
- Tips for navigation

This helps users understand the ML-powered semantic search happening behind the scenes!

## Development

**Test the feature locally:**

1. Start backend:

```bash
cd Ecommerce-API
uvicorn app.main:app --reload
```

2. Start frontend:

```bash
cd "Ecommerce Frontend"
pnpm dev
```

3. Navigate to search page and enter a query
4. Click "Launch Into Orbit" button
5. Verify 3D visualization loads correctly

**Debug mode:**

```typescript
// In OrbitViewer.tsx, add to Scene component:
<axesHelper args={[5]} /> // Shows X (red), Y (green), Z (blue) axes
<gridHelper args={[20, 20]} /> // Shows grid at y=0 plane
```

## Credits

- **UMAP**: Leland McInnes, John Healy, James Melville
- **Three.js**: Ricardo Cabello (mrdoob)
- **React Three Fiber**: Poimandres collective
- **CLIP Embeddings**: OpenAI
- **Qdrant**: Vector database for semantic search

---

_This feature reveals the hidden semantic space underlying your product search—what was invisible is now explorable in 3D!_ 🚀✨
