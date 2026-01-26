import React, { ReactNode, useEffect } from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import { VscTriangleDown } from "react-icons/vsc";
import { Label } from "./LabelGeneric";
import { cn } from "@/lib/utils";
export type SelectGenericOption = {
  group_name?: string; // add only the group name to create a group
  label: string | ReactNode;
  value: string | number;
  disabled?: boolean;
};

export function SelectGeneric({
  className,
  label,
  error,
  name = "select",
  defaultValue,
  options,
  group, // if true, every option with a group_name will be a group_name label
  required,
  capitalize,
  onChange,
  inputLabel,
  cursor = "black",
  variant = "regular",
}: {
  className?: string;
  label?: string;
  name?: string;
  error?: boolean;
  defaultValue?: SelectGenericOption;
  options: SelectGenericOption[] | undefined | null;
  group?: boolean;
  required?: boolean;
  capitalize?: boolean;
  onChange?: (value: string) => void;
  inputLabel?: string | ReactNode;
  cursor?: "white" | "black" | string;
  disabled?: boolean;
  variant?: "regular" | "oversized";
}) {
  const [open, setOpen] = React.useState(false);
  const cursor_type =
    cursor === "white"
      ? "text-white h-full min-w-3 mr-2"
      : "text-gray-600 rounded-br-sm !min-w-8 rounded-tr-sm px-2.5 h-full ";
  if (!options) return;
  return (
    <FormControl className="group flex w-fit flex-col gap-3">
      <Label name={name} required={required} error={error}>
        {label}
      </Label>
      <div className="relative flex flex-row items-center justify-center gap-1.5">
        <Select
          variant="outlined"
          data-placeholder-trigger="keydown"
          className={cn(
            `group peer border transition-all ease-linear first-letter:capitalize max-[515px]:w-[7.5rem] [&_.Mui-selected]:!bg-color1 [&_.MuiOutlinedInput-notchedOutline]:border-none ${open ? "rounded-b-none rounded-t-sm shadow-md" : "rounded-sm shadow-sm hover:shadow-md"} ${
              variant === "regular"
                ? "h-9 w-[12.5rem]"
                : "h-12 w-[11.5rem] border-2 border-gray-400"
            }`,
            className,
          )}
          label={label}
          id={label}
          name={name}
          open={open}
          defaultValue={defaultValue ? String(defaultValue.value) : "none"}
          displayEmpty
          required={required}
          onOpen={(e) => setOpen(true)}
          onClose={(e) => setOpen(false)}
          onChange={(e) => onChange?.(e.target.value)}
          IconComponent={() => (
            <VscTriangleDown
              className={`cursor-pointer transition-all ease-linear ${cursor_type} ${open ? "rotate-180" : ""} `}
              onClick={() => setOpen((old) => !old)}
            />
          )}
          MenuProps={{
            autoFocus: false,
            PaperProps: {
              style: {
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
                maxHeight: "20rem",
                overflowY: "auto",
                boxShadow: `0px 1px 4px 2px rgba(0, 0, 0, 0.1)`,
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: cursor,
            },
            "& .MuiSvgIcon-root": {
              color: cursor,
            },
          }}
        >
          {group
            ? options?.map(
                (option: SelectGenericOption, i: number): JSX.Element => {
                  return option?.group_name ? (
                    <>
                      <hr className="m-0 h-[unset] !w-full shrink-0 border-solid border-[rgba(0,0,0,0.12)]" />
                      <MenuItem
                        key={option?.group_name}
                        className="group peer !max-h-7 !w-full !border-y !border-black !px-2 !py-1 !text-center !text-[0.875rem] !opacity-100 first-letter:capitalize"
                        disabled
                        aria-readonly
                        value="none"
                      >
                        {option?.group_name}
                      </MenuItem>
                    </>
                  ) : (
                    <MenuItem
                      value={option?.value}
                      className={`peer !max-h-10 !px-2 !py-2 text-[0.95rem] capitalize transition-all ease-linear hover:!bg-color1 hover:text-white ${
                        option?.disabled ? "opacity-50" : "opacity-90"
                      } ${capitalize ? "capitalize" : ""}`}
                      key={Number(option?.value) + i}
                      disabled={option?.disabled}
                    >
                      {option?.label}
                    </MenuItem>
                  );
                },
              )
            : options?.map((option, i) => {
                return (
                  <MenuItem
                    value={option?.value}
                    className={`peer transition-all ease-linear first-letter:capitalize hover:!bg-color1 hover:text-white ${capitalize ? "capitalize" : ""} `}
                    key={(name ?? inputLabel ?? label) + i}
                  >
                    {option?.label}
                  </MenuItem>
                );
              })}
          {inputLabel && (
            <MenuItem
              value="none"
              className="peer invisible !hidden font-sans first-letter:capitalize"
              disabled
            >
              {inputLabel}
            </MenuItem>
          )}
        </Select>
        
        {error && (
          <span className="absolute -bottom-[1.375rem] left-0 w-max text-sm text-red-600">
            {error}
          </span>
        )}
      </div>
    </FormControl>
  );
}
