import Checkbox from "@/app/ui/Checkbox";
import createNewPathname from "@/helpers/createNewPathname";
import useCategories from "@/hooks/data/categories/useCategories";
import useTranslation from "@/translation/useTranslation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function CategoriesFilter() {
  const paramsCategoryName = useSearchParams().get("category");
  const category = paramsCategoryName ?? null;
  const { data: categories } = useCategories();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: translation } = useTranslation();
  return (
    <div className="flex flex-col items-start justify-center bg-white">
      <span className="mb-1 text-sm font-medium uppercase">
        {translation?.lang["Category"]}
      </span>
      {categories?.data?.map((e) => (
        <Checkbox
          key={e.name}
          name="discount_options"
          label={e.name}
          checked={category === e.name}
          onChange={() => {
            router.push(
              createNewPathname({
                currentPathname: pathname,
                currentSearchParams: searchParams,
                values: [
                  {
                    name: "category",
                    value: category === e.name ? "" : e.name,
                  },
                ],
              }),
              {
                scroll: false,
              },
            );
          }}
        />
      ))}
    </div>
  );
}
