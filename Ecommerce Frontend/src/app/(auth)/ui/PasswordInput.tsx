"use client";
import React from "react";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  OutlinedInputProps,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
export default function PasswordInput(
  args: Omit<OutlinedInputProps, "id" | "type" | "endAdornment">,
) {
  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };
  return (
    <FormControl className="w-full" variant="filled">
      <InputLabel htmlFor="filled-adornment-password">{args.label}</InputLabel>
      <OutlinedInput
        id="filled-adornment-password"
        type={showPassword ? "text" : "password"}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        {...args}
      />
    </FormControl>
  );
}
