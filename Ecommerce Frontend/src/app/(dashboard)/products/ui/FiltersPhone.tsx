"use client";
import { AiOutlineMenuUnfold } from "react-icons/ai";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filters } from "./Filters";
import useTranslation from "@/translation/useTranslation";

export default function FiltersPhone() {
  const { data: translation } = useTranslation();
  return (
    <Sheet modal>
      <SheetTrigger>
        <div className="hidden h-9 flex-row items-center gap-1 rounded-md border-2 p-2 max-[830px]:flex">
          <span>Filters</span>
          <AiOutlineMenuUnfold />
        </div>
      </SheetTrigger>
      <SheetContent
        className="z-[100] w-[20rem] p-0 max-[400px]:w-full"
        side={"left"}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center justify-start p-6">
            <span className="w-full min-w-full bg-white text-center text-xl font-bold text-color8">
              {translation?.lang["Choose a filter"]}
            </span>
          </SheetTitle>
          <SheetDescription className="flex h-full flex-col items-start justify-start p-8">
            <Filters />
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
