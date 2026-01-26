import React from "react";
export default function TooltipGeneric({
  tip,
  position,
  children,
}: {
  tip: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}) {
  const positions = {
    top: "tooltip-top",
    bottom: "tooltip-bottom",
    left: "tooltip-left",
    right: "tooltip-right",
  };
  return (
    <div
      className={`tooltip ${positions[position ?? "top"]} z-[40]`}
      data-tip={tip}
    >
      {children}
    </div>
  );
}
