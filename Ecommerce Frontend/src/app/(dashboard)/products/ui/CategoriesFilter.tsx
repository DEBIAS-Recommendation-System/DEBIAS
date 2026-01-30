import Checkbox from "@/app/ui/Checkbox";
import createNewPathname from "@/helpers/createNewPathname";
import useTranslation from "@/translation/useTranslation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Local categories data matching the product category_codes
const categories = [
  { id: 1, name: "Accessories" },
  { id: 2, name: "Apparel" },
  { id: 3, name: "Appliances" },
  { id: 4, name: "Computers" },
  { id: 5, name: "Construction" },
  { id: 6, name: "Electronics" },
  { id: 7, name: "Furniture" },
  { id: 8, name: "Kids" },
  { id: 9, name: "Sport" },
];

export default function CategoriesFilter() {
  // Support multiple category selection by parsing comma-separated categories
  const paramsCategoryNames = useSearchParams().get("category");
  const selectedCategories = paramsCategoryNames ? paramsCategoryNames.split(',') : [];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: translation } = useTranslation();
  
  return (
    <div className="flex flex-col items-start justify-center bg-white">
      <span className="mb-1 text-sm font-medium uppercase">
        {translation?.lang["Category"]}
      </span>
      {categories?.map((e) => {
        const isChecked = selectedCategories.includes(e.name);
        return (
          <Checkbox
            key={e.name}
            name="category_options"
            label={e.name}
            checked={isChecked}
            onChange={() => {
              // Toggle category in the array
              let newCategories: string[];
              if (isChecked) {
                // Remove category
                newCategories = selectedCategories.filter(cat => cat !== e.name);
              } else {
                // Add category
                newCategories = [...selectedCategories, e.name];
              }
              
              router.push(
                createNewPathname({
                  currentPathname: pathname,
                  currentSearchParams: searchParams,
                  values: [
                    {
                      name: "category",
                      value: newCategories.join(','),
                    },
                  ],
                }),
                {
                  scroll: false,
                },
              );
            }}
          />
        );
      })}
    </div>
  );
}
