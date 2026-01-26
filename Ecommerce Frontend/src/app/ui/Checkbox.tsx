import React from "react";
import { Checkbox as MuiCheckbox } from "@mui/material";

type CheckboxType = {
  label: string;
  name: string;
  checked: boolean;
  onChange: (isChecked: boolean) => void;
};

function Checkbox({ label, name, checked, onChange }: CheckboxType) {
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isChecked: boolean,
  ) => {
    onChange(isChecked);
  };
  return (
    <div className="my-1 flex items-center gap-2">
      <MuiCheckbox
        id={`checked-checkbox-${name}`}
        name={name}
        checked={checked}
        onChange={handleCheckboxChange}
        sx={{
          color: "#ff6900",
          "&.Mui-checked": {
            color: "#ff6900",
          },
        }}
        className="h-4 w-4 cursor-pointer rounded border-r-color8 bg-white text-color8 !accent-color8 transition-all ease-linear checked:!accent-color8"
      />
      <label
        htmlFor={`checked-checkbox-${name}`}
        className="cursor-pointer capitalize"
      >
        {label}
      </label>
    </div>
  );
}

export default Checkbox;
