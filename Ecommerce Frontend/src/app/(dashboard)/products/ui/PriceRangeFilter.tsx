"use client";
import { useState, useEffect, useCallback } from "react";
import { Slider } from "@mui/material";
import debounce from "lodash.debounce";
import useTranslation from "@/translation/useTranslation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import createNewPathname from "@/helpers/createNewPathname";

export default function PriceRangeFilter() {
  const minPriceSearchParams = useSearchParams().get("minPrice");
  const maxPriceSearchParams = useSearchParams().get("maxPrice");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<number[]>([5, 999]);

  const debouncedOnChange = useCallback(
    debounce((newValue: number[]) => {
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
    }, 1500),
    [value],
  );

  useEffect(() => {
    debouncedOnChange(value);
    return () => {
      debouncedOnChange.cancel();
    };
  }, [value, debouncedOnChange]);

  useEffect(() => {
    if (minPriceSearchParams && Number(minPriceSearchParams) !== value[0]) {
      setValue((prev) => [Number(minPriceSearchParams), prev[1]]);
    }
    if (maxPriceSearchParams && Number(maxPriceSearchParams) !== value[1]) {
      setValue((prev) => [prev[0], Number(maxPriceSearchParams)]);
    }
  }, [minPriceSearchParams, maxPriceSearchParams]);

  const validateAndSetValue = (newValue: number[]) => {
    const [min, max] = newValue;
    if (min > max) {
      setValue([max, max]); // Adjust min to match max if invalid
    } else {
      setValue(newValue);
    }
  };

  const { data: translation } = useTranslation();

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
        defaultValue={[0, 999]}
        max={999}
        min={0}
        valueLabelDisplay="auto"
        getAriaValueText={(value) => String(value)}
      />
      <div className="mt-2 flex flex-row items-center justify-between">
        <input
          type="number"
          value={value[0]}
          className="h-[2rem] w-full rounded-sm border border-gray-500 text-center focus:outline-color8"
          onChange={(e) => {
            const newMin = Math.max(0, Number(e.target.value));
            validateAndSetValue([newMin, value[1]]);
          }}
        />
        <span className="mx-4 text-lg font-bold">-</span>
        <input
          type="number"
          value={value[1]}
          className="h-[2rem] w-full rounded-sm border border-gray-500 text-center focus:outline-color8"
          onChange={(e) => {
            const newMax = Math.min(Number(e.target.value), 999);
            validateAndSetValue([value[0], newMax]);
          }}
        />
      </div>
    </div>
  );
}
