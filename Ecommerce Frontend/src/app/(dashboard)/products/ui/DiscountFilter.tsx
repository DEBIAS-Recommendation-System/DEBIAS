import Checkbox from "@/app/ui/Checkbox";
import createNewPathname from "@/helpers/createNewPathname";
import useTranslation from "@/translation/useTranslation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function DiscountFilter() {
  const searchParamsDiscount = useSearchParams().get("discount");
  const discount = Number(searchParamsDiscount);
  const discount_options = useMemo(
    () => [
      {
        value: 10,
        label: ">10%",
      },
      {
        value: 30,
        label: ">30%",
      },
    ],
    [],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: translation } = useTranslation();
  return (
    <div className="flex flex-col items-start justify-center bg-white">
      <span className="mb-1 text-sm font-medium uppercase">
        {translation?.lang["Discount"]} (%)
      </span>
      {discount_options.map((e) => (
        <Checkbox
          key={e.value}
          name="discount_options"
          label={e.label}
          checked={discount === e.value}
          onChange={() => {
            router.push(
              createNewPathname({
                currentPathname: pathname,
                currentSearchParams: searchParams,
                values: [
                  {
                    name: "discount",
                    value: String(discount === e.value ? "" : e.value),
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
