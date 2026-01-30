"use client";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import { IoSearchSharp } from "react-icons/io5";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import debounce from "lodash.debounce";
import { Spinner } from "@/app/ui/Spinner";
import { Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SemanticProduct {
  product_id: number;
  id: string; // Transformed from product_id
  title: string;
  price: number;
  imgUrl?: string;
  brand?: string;
  category?: string;
  score?: number;
}

interface RecommendationResponse {
  query_type: string;
  total_results: number;
  recommendations: Array<{
    id: number;
    score: number;
    title: string;
    brand?: string;
    category?: string;
    price?: number;
    image_url?: string;
    description?: string;
  }>;
  filters_applied?: Record<string, any>;
}

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export default function SemanticSearchBar() {
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [products, setProducts] = useState<SemanticProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use the /recommendations/ POST endpoint for search
      const response = await fetch(`${API_URL}/recommendations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query_text: query,
          limit: 6,
          use_mmr: true,
          mmr_diversity: 0.3,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: RecommendationResponse = await response.json();
      
      // Transform recommendations to product format
      const transformedProducts: SemanticProduct[] = (data.recommendations || []).map(rec => ({
        product_id: rec.id,
        id: String(rec.id),
        title: rec.title,
        price: rec.price || 0,
        imgUrl: rec.image_url,
        brand: rec.brand,
        category: rec.category,
        score: rec.score,
      }));
      
      setProducts(transformedProducts);
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedValue(query);
      searchProducts(query);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(value);
    return () => {
      debouncedSearch.cancel();
    };
  }, [value, debouncedSearch]);

  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    width: "100%",
    "& .MuiInputBase-input": {
      padding: theme.spacing(1, 1, 1, 0),
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create("width"),
      [theme.breakpoints.up("sm")]: {
        width: value ? "30ch" : "20ch",
        "&:focus": {
          width: "35ch",
        },
      },
    },
  }));

  const isEmptyResult = products.length === 0 && debouncedValue && !isLoading;

  return (
    <>
      <Search dir="ltr" className="relative w-full max-w-2xl">
        <SearchIconWrapper>
          <IoSearchSharp className="z-[70] h-5 w-5 text-slate-500 group-focus-within:text-slate-900" />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Try: 'comfortable running shoes' or 'blue jeans'..."
          className="z-[60] h-11 w-full rounded-full border-2 border-purple-300 bg-white placeholder-gray-400 shadow-sm transition-all ease-linear focus-within:border-purple-500 focus-within:shadow-lg"
          inputProps={{ "aria-label": "semantic search" }}
          value={value}
          autoFocus={!!value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="absolute right-3 top-3 flex items-center gap-1 text-xs text-purple-600">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">AI</span>
        </div>

        {isOpen && value && (
          <div className="absolute top-[110%] z-[100] flex w-full flex-col rounded-lg bg-white shadow-xl">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="size-12" />
              </div>
            ) : isEmptyResult ? (
              <div className="flex h-40 flex-col items-center justify-center p-4">
                <p className="text-gray-500">No products found</p>
                <p className="mt-2 text-sm text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 p-3">
                  <p className="text-xs text-gray-500">
                    Found {products.length} semantically similar products
                  </p>
                </div>
                {products.map((product) => (
                  <SearchResultProduct
                    key={product.product_id}
                    product={product}
                    setValue={setValue}
                    setIsOpen={setIsOpen}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </Search>

      {isOpen && value && (
        <div
          onClick={() => {
            setValue("");
            setIsOpen(false);
          }}
          className="fixed inset-0 z-[50] cursor-pointer bg-black opacity-35"
        />
      )}
    </>
  );
}

function SearchResultProduct({
  product,
  setValue,
  setIsOpen,
}: {
  product: SemanticProduct;
  setValue: (value: string) => void;
  setIsOpen: (open: boolean) => void;
}) {
  return (
    <Link
      href={`/products/${product.id || product.product_id}`}
      onClick={() => {
        setValue("");
        setIsOpen(false);
      }}
      className="flex items-center gap-3 border-b border-gray-100 p-3 transition-colors hover:bg-gray-50"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        {product.imgUrl ? (
          <Image
            src={product.imgUrl}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="truncate text-sm font-medium text-gray-900">
          {product.title}
        </h4>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-sm font-semibold text-purple-600">
            ${product.price.toFixed(2)}
          </p>
          {product.score && (
            <span className="text-xs text-gray-400">
              {Math.round(product.score * 100)}% match
            </span>
          )}
        </div>
        {product.brand && (
          <p className="mt-0.5 text-xs text-gray-500">{product.brand}</p>
        )}
      </div>
    </Link>
  );
}
