"use client";
import { useState, useEffect, useCallback } from "react";
import { Slider } from "@mui/material";
import debounce from "lodash.debounce";
import useTranslation from "@/translation/useTranslation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import createNewPathname from "@/helpers/createNewPathname";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function PriceRangeFilter() {
  const minPriceSearchParams = useSearchParams().get("minPrice");
  const maxPriceSearchParams = useSearchParams().get("maxPrice");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State for price range from database
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [value, setValue] = useState<number[]>([0, 1000]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch price range from API on mount
  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        const response = await fetch(`${API_URL}/products/price-range`);
        const result = await response.json();
        if (result.data) {
          const { min_price, max_price } = result.data;
          const min = Math.floor(min_price);
          const max = Math.ceil(max_price);
          
          setPriceRange({ min, max });
          
          // Only set slider values if URL params are not present
          if (!minPriceSearchParams && !maxPriceSearchParams) {
            setValue([min, max]);
          } else {
            // Use URL params if they exist
            const urlMin = minPriceSearchParams ? Number(minPriceSearchParams) : min;
            const urlMax = maxPriceSearchParams ? Number(maxPriceSearchParams) : max;
            setValue([urlMin, urlMax]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch price range:", error);
        // Fallback to default values
        setPriceRange({ min: 0, max: 1000 });
        if (!minPriceSearchParams && !maxPriceSearchParams) {
          setValue([0, 1000]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceRange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const debouncedOnChange = useCallback(
    (newValue: number[]) => {
      router.push(
        createNewPathname({
          currentPathname: pathname,
          currentSearchParams: searchParams,
          values: [
            { name: "minPrice", value: String(newValue[0]) },
            { name: "maxPrice", value: String(newValue[1]) },
          ],
        }),
        {
          scroll: false,
        },
      );
    },
    [pathname, searchParams, router],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChangeWithDelay = useCallback(
    debounce(debouncedOnChange, 1500),
    [debouncedOnChange],
  );

  useEffect(() => {
    debouncedOnChangeWithDelay(value);
    return () => {
      debouncedOnChangeWithDelay.cancel();
    };
  }, [value, debouncedOnChangeWithDelay]);

  useEffect(() => {
    // Don't update if still loading
    if (isLoading) return;
    
    // Only sync from URL params if they've actually changed
    if (minPriceSearchParams && Number(minPriceSearchParams) !== value[0]) {
      setValue((prev) => [Number(minPriceSearchParams), prev[1]]);
    }
    if (maxPriceSearchParams && Number(maxPriceSearchParams) !== value[1]) {
      setValue((prev) => [prev[0], Number(maxPriceSearchParams)]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceSearchParams, maxPriceSearchParams, isLoading]);

  const validateAndSetValue = (newValue: number[]) => {
    const [min, max] = newValue;
    // Ensure min doesn't exceed max
    if (min > max) {
      setValue([max, max]);
    } else {
      setValue(newValue);
    }
  };

  const { data: translation } = useTranslation();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-start justify-center bg-white">
        <span className="mb-1 text-sm font-medium uppercase">Loading price range...</span>
      </div>
    );
  }

  return (
    <div
      dir={"ltr"}
      className="flex flex-col items-start justify-center bg-white"
    >
      <span
        dir={translation?.default_language === "ar" ? "rtl" : "ltr"}
        className={`mb-1 ${translation?.default_language === "ar" ? "ml-auto" : ""} text-right text-sm font-medium uppercase`}
      >
        {translation?.lang["price"]}(TND)
      </span>
      <Slider
        className="!mx-1 !text-color8"
        onChange={(e, newValue) => {
          validateAndSetValue(newValue as number[]);
        }}
        value={value}
        defaultValue={[priceRange.min, priceRange.max]}
        max={priceRange.max}
        min={priceRange.min}
        valueLabelDisplay="auto"
        getAriaValueText={(value) => String(value)}
      />
      <div className="mt-2 flex flex-row items-center justify-between">
        <input
          type="number"
          value={value[0]}
          min={priceRange.min}
          max={priceRange.max}
          className="h-[2rem] w-full rounded-sm border border-gray-500 text-center focus:outline-color8"
          aria-label="Minimum price"
          onChange={(e) => {
            const newMin = Math.max(priceRange.min, Number(e.target.value));
            validateAndSetValue([newMin, value[1]]);
          }}
        />
        <span className="mx-4 text-lg font-bold">-</span>
        <input
          type="number"
          value={value[1]}
          min={priceRange.min}
          max={priceRange.max}
          className="h-[2rem] w-full rounded-sm border border-gray-500 text-center focus:outline-color8"
          aria-label="Maximum price"
          onChange={(e) => {
            const newMax = Math.min(Number(e.target.value), 999);
            validateAndSetValue([value[0], newMax]);
          }}
        />
      </div>
    </div>
  );
}
