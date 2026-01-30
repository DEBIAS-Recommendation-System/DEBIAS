"use client";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import { IoSearchSharp } from "react-icons/io5";
import { useCallback, useEffect, useState } from "react";
import useProducts from "@/hooks/data/products/useProducts";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Spinner } from "@/app/ui/Spinner";
import debounce from "lodash.debounce";

// Dynamic import to prevent SSR issues
const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

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

export default function SearchBar() {
  const [value, setValue] = useState(null as string | null);
  const [debouncedValue, setDebouncedValue] = useState(null as string | null);
  const { data: products, isLoading } = useProducts({
    limit: 6,
    page: 1,
    search: debouncedValue
      ? {
          column: "title",
          value: debouncedValue,
        }
      : undefined,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((newValue: string | null) => {
      setDebouncedValue(newValue);
    }, 500),
    [],
  );
  useEffect(() => {
    debouncedOnChange(value);
    return () => {
      debouncedOnChange.cancel();
    };
  }, [value, debouncedOnChange]);
  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    width: "100%",
    "& .MuiInputBase-input": {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create("width"),
      [theme.breakpoints.up("sm")]: {
        width: value !== null ? "20ch" : "12ch",
        "&:focus": {
          width: "20ch",
        },
      },
    },
  }));
  const isEmptyResult = products?.data && products.data.length === 0;
  return (
    <>
      <Search dir="ltr" className="relative max-[400px]:w-[50%]">
        <SearchIconWrapper>
          <IoSearchSharp className="z-[70] h-5 w-5 text-slate-500 group-focus-within:text-slate-900" />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search..."
          className={`z-[60] h-9 rounded-3xl border border-gray-400 bg-white placeholder-gray-400 shadow-sm transition-all ease-linear focus-within:shadow-md`}
          inputProps={{ "aria-label": "search" }}
          value={value ?? ""}
          autoFocus={value !== null}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        {value !== null && (
          <div
            className={`absolute top-[110%] z-[100] flex h-fit w-[125%] flex-col rounded-b-lg rounded-t-sm bg-white transition-all duration-200 ease-in max-[400px]:-right-[70%] max-[400px]:w-[200%] ${
              isEmptyResult
                ? "right-0 min-h-60 w-full items-center justify-center"
                : "-right-[12.5%] w-[125%]"
            }`}
          >
            {isLoading ? (
              <Spinner className="my-14 ml-[40%] size-12 self-center justify-self-center" />
            ) : isEmptyResult ? (
              <Player
                src={
                  "https://lottie.host/85fb7313-2848-45c2-bdb9-2b729f57afc2/AwfmWMtW8n.json"
                }
                className="h-40 w-40"
                loop
                autoplay
              />
            ) : (
              products?.data?.map((product) => (
                <SearchBarProduct
                  key={product?.id}
                  product={product}
                  setValue={setValue}
                />
              ))
            )}
          </div>
        )}
      </Search>
      {value !== null && (
        <div
          onClick={() => {
            setValue(null);
          }}
          className="fixed right-0 top-0 z-[50] h-screen min-w-screen cursor-pointer bg-black opacity-35"
        ></div>
      )}
    </>
  );
}

function SearchBarProduct({
  product,
  setValue,
}: {
  product: {
    id: string;
    title: string;
    description: string;
    imgUrl: string | null;
  } | null;
  setValue: (value: any) => void;
}) {
  return (
    <Link
      href={`/products/${product?.id}`}
      key={product?.id}
      className="flex cursor-pointer flex-row items-start gap-2 border-b border-gray-300 p-2 hover:bg-gray-100"
      onClick={() => {
        setValue(null);
      }}
    >
      <Image
        src={product?.imgUrl ?? ""}
        alt=""
        className="overflow-clip rounded-sm bg-clip-border"
        width={75}
        height={75}
      />
      <div className="mt-2 flex-col">
        <p className="font-semibold">{product?.title}</p>
        <p className="line-clamp-2 text-sm">{product?.description}</p>
      </div>
    </Link>
  );
}
