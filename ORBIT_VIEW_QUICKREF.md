# 🚀 Orbit View - Quick Reference

## Installation

```powershell
# Backend
cd Ecommerce-API
pip install umap-learn

# Frontend
cd "Ecommerce Frontend"
pnpm install
```

## Start Services

```powershell
# Terminal 1
cd Ecommerce-API && uvicorn app.main:app --reload

# Terminal 2
cd "Ecommerce Frontend" && pnpm dev
```

## Usage

1. Search for products
2. Click **🚀 Launch Into Orbit** button
3. **Drag** to rotate | **Scroll** to zoom | **Hover** for details
4. Press **ESC** or click **Return to Earth ↩** to exit

## Files Modified

### Backend

- ✅ `requirements.txt` - Added umap-learn
- ✅ `app/services/qdrant_service.py` - Vector retrieval + UMAP
- ✅ `app/schemas/recommendations.py` - Orbit view schemas
- ✅ `app/routers/recommendations.py` - `/orbit-view` endpoint

### Frontend

- ✅ `package.json` - Three.js dependencies
- ✅ `src/components/OrbitView/OrbitViewer.tsx` - 3D visualization
- ✅ `src/api/fastapi/recommendations.ts` - API client
- ✅ `src/components/search/DebiasSearch.tsx` - Launch button

## API Endpoint

```typescript
POST /recommendations/orbit-view
{
  "query_text": "running shoes",
  "limit": 150
}
```

## Key Features

- 🌟 **Central Sun**: Search query at origin (0,0,0)
- 🎨 **Color-coded**: Categories have distinct colors
- 📏 **Size**: Larger spheres = more similar to query
- 🔄 **Auto-rotate**: Pauses on hover/interaction
- 🖼️ **3D Tooltips**: Product cards in space
- 🌌 **HDR Environment**: Nebula background
- ⌨️ **ESC Key**: Quick exit

## Category Colors

- 🔵 Electronics - 💗 Fashion - 🟢 Sports
- 🟠 Home - 🟣 Books - 🔴 Toys - 💗 Beauty - 🟢 Food

## Troubleshooting

**Black screen?**

- Check browser console for errors
- Verify `/public/HDR_hazy_nebulae.hdr` exists
- Update graphics drivers

**"umap-learn not installed"?**

```bash
pip install umap-learn
```

**TypeScript errors?**

```bash
cd "Ecommerce Frontend" && pnpm install
```

**Performance issues?**

- Reduce limit to 50-100 products
- Close GPU-intensive applications
- Try different browser (Chrome recommended)

## Configuration

**Change product count:**

```typescript
// DebiasSearch.tsx, line 68
limit: 150; // Change to 50-300
```

**Adjust UMAP clustering:**

```python
# qdrant_service.py, line 705
n_neighbors=15,  # 5-50 (lower = tighter clusters)
min_dist=0.1,    # 0.0-1.0 (lower = denser)
```

## Documentation

- 📘 **Full Guide**: `ORBIT_VIEW_GUIDE.md`
- 📋 **Implementation**: `ORBIT_VIEW_IMPLEMENTATION.md`
- 🔧 **Installation Script**: `install-orbit-view.ps1`

## Next Steps

1. Run `.\install-orbit-view.ps1`
2. Start both services
3. Test on search page
4. Read full guides for customization

---

**Transform boring 2D search into explorable 3D semantic space!** 🌌✨
