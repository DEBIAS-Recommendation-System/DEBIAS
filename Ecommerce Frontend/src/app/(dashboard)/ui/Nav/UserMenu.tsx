"use client";
import { Logout } from "@mui/icons-material";
import { Divider, IconButton, Menu } from "@mui/material";
import React from "react";
import { FaHeart } from "react-icons/fa";
import SignOutBtn from "./SignOutBtn";
import TooltipGeneric from "@/app/ui/InsightGeneric";
import { FaUserLarge } from "react-icons/fa6";
import useTranslation from "@/translation/useTranslation";
import Link from "next/link";

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const { data: translation } = useTranslation();
  const items = [
    {
      title: translation?.lang["Account"] ?? "My Account",
      icon: (
        <FaUserLarge className="size-[1.85rem] rounded-full bg-gray-500 p-1.5 text-center text-sm text-white group-hover:bg-white group-hover:text-color1" />
      ),
      href: "/account",
    },
    {
      title: translation?.lang["My Orders"],
      icon: (
        <FaUserLarge className="size-[1.85rem] rounded-full bg-gray-500 p-1.5 text-center text-sm text-white group-hover:bg-white group-hover:text-color1" />
      ),
      href: "/Orders",
    },
  ];
  return (
    <>
      <TooltipGeneric
        tip={translation?.lang["Account"] ?? "Account"}
        position="bottom"
      >
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <FaUserLarge className="size-[1.85rem] rounded-full bg-gray-500 p-1.5 text-center text-sm text-white" />
        </IconButton>
      </TooltipGeneric>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {items.map((item, i) => (
          <div key={(item.title ?? "") + i} onClick={handleClose}>
            <Link
              href={item.href}
              className="group flex cursor-pointer flex-row items-center gap-4 px-3 py-2 transition-all ease-linear hover:bg-color1 hover:text-white"
            >
              {item.icon}
              {item.title}
            </Link>
          </div>
        ))}
        <Divider />
        <div
          className="group flex cursor-pointer flex-row items-center gap-4 px-3 py-2 transition-all ease-linear hover:bg-color1 hover:text-white"
          onClick={handleClose}
        >
          <SignOutBtn>
            <Logout className="ml-1 size-7 text-gray-500 group-hover:text-white" />
            <span className="">{translation?.lang["Logout"]}</span>
          </SignOutBtn>
        </div>
      </Menu>
    </>
  );
}
