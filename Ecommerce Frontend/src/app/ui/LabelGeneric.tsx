import { LabelHTMLAttributes } from "react";
import { BsExclamationCircleFill } from "react-icons/bs";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
    children: React.ReactNode;
    required?: boolean;
    name: string;
    error?: boolean;
  };
  
  export function Label({
    children,
    required,
    name,
    error,
    ...props
  }: LabelProps) {
    if (!children) return;
    return (
      <div className={`flex flex-row items-center gap-1`}>
        {error && <BsExclamationCircleFill className="text-sm text-color9-500" />}
        <label
          {...props}
          htmlFor={name + "_id"}
          className={`relative w-fit text-sm text-gray-21 ${error && "!text-color9-500"}`}
        >
          {children}
          {required && <span className="absolute -right-2 top-0 text-sm">*</span>}
        </label>
      </div>
    );
  }