import { MdToys } from "react-icons/md";
import { GiBrain } from "react-icons/gi";
import { MdConstruction } from "react-icons/md";
import { RiDiscountPercentFill } from "react-icons/ri";
import { AiOutlineMenuUnfold } from "react-icons/ai";

const menuItems = [
  {
    title: "Sfari moments",
    href: "/products",
    icon: ({ className }: { className: string }) => (
      <AiOutlineMenuUnfold className={className} />
    ),
    subItems: [],
  },
  {
    title: "Toys",
    href: "/products",
    icon: ({ className }: { className: string }) => (
      <MdToys className={className} />
    ),
    subItems: [
      {
        title: "Concentration",
        filter: {
          category: "concentration",
        },
        icon: ({ className }: { className: string }) => (
          <GiBrain className={className} />
        ),
      },
      {
        title: "Social",
        filter: {
          category: "social",
        },
        icon: ({ className }: { className: string }) => (
          <MdToys className={className} />
        ),
      },
      {
        title: "Construction",
        filter: {
          category: "construction",
        },
        icon: ({ className }: { className: string }) => (
          <MdConstruction className={className} />
        ),
      },
    ],
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
