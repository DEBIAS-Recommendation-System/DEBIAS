import React from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  error?: string; // Added for error handling
}

export default function Input({
  label,
  type,
  name,
  placeholder,
  required,
  error, // Accept error as a prop
}: InputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="flex w-full flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div>
        <div
          className={`relative flex h-11 items-center rounded-md px-4 ${
            error ? "border-red-500" : "border-gray-300"
          } border`}
        >
          <input
            type={
              type.toUpperCase() === "PASSWORD"
                ? showPassword
                  ? "text"
                  : "password"
                : type
            }
            name={name}
            placeholder={placeholder}
            className="w-full text-gray-800 outline-none"
          />
          {type.toUpperCase() === "PASSWORD" && (
            <div
              onClick={() => setShowPassword((prev) => !prev)}
              className="cursor-pointer"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}{" "}
      </div>

      {/* Display error */}
    </div>
  );
}
