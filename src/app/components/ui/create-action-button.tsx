import * as React from "react";
import { PlusIcon } from "./plus-icon";

type CreateActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function CreateActionButton({ className = "", children, ...props }: CreateActionButtonProps) {
  return (
    <button
      className={`inline-flex h-9 min-h-9 min-w-[142px] flex-none items-center justify-center gap-2 rounded-lg bg-[#4A6FA5] px-4 text-[14px] leading-5 text-white transition-colors hover:bg-[#3d5a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6FA5]/30 ${className}`}
      style={{ fontFamily: "Geist", fontWeight: 500, ...(props.style || {}) }}
      {...props}
    >
      <PlusIcon className="h-4 w-4 shrink-0" />
      {children}
    </button>
  );
}
