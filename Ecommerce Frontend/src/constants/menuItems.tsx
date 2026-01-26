import { RiDiscountPercentFill } from "react-icons/ri";
import { AiOutlineShop } from "react-icons/ai";
import { MdCategory } from "react-icons/md";

const menuItems = [
  {
    title: "All Products",
    href: "/products",
    icon: ({ className }: { className: string }) => (
      <AiOutlineShop className={className} />
    ),
    subItems: [],
  },
  {
    title: "Categories",
    href: "/products",
    icon: ({ className }: { className: string }) => (
      <MdCategory className={className} />
    ),
    subItems: [],
  },
  {
    title: "Deals",
    href: "/products",
    icon: ({ className }: { className: string }) => (
      <RiDiscountPercentFill className={className} />
    ),
    subItems: [
      {
        title: "Discounts",
        filter: {
          discount: 10,
        },
        icon: ({ className }: { className: string }) => (
          <RiDiscountPercentFill className={className} />
        ),
      },
    ],
  },
] as const;
export { menuItems };
