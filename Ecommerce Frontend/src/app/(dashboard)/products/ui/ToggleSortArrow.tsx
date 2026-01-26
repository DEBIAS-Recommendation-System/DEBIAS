import { useState } from "react";
import { FaLongArrowAltDown } from "react-icons/fa";

export function ToggleSortArrow({
  onClick = (a: boolean) => {},
}: {
  onClick: (value: boolean) => void;
}) {
  const [toggleDirection, setToggleDirection] = useState(false);
  const handleClick = () => {
    setToggleDirection((prev) => !prev);
    onClick(toggleDirection);
  };
  return (
    <FaLongArrowAltDown
      className={`size-8 cursor-pointer rounded-full border p-1.5 shadow-sm transition-all ease-linear hover:shadow-md ${
        toggleDirection ? "rotate-180" : ""
      }`}
      onClick={(e) => {
        handleClick();
      }}
    />
  );
}
