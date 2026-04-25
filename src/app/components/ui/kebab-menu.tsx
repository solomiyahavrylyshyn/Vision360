import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import { cn } from "./utils";

type KebabMenuProps = {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  triggerClassName?: string;
  iconClassName?: string;
  label?: string; // aria-label, default "More actions"
  contentClassName?: string;
};

export function KebabMenu({
  children,
  align = "end",
  side = "bottom",
  triggerClassName,
  iconClassName,
  label = "More actions",
  contentClassName,
}: KebabMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A2332] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6FA5] focus-visible:ring-offset-1",
            triggerClassName
          )}
        >
          <span className={cn("material-icons", iconClassName)} style={{ fontSize: "18px" }}>
            more_vert
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        className={cn("min-w-[180px] py-1", contentClassName)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type KebabItemProps = {
  icon?: string; // material-icons name
  children: React.ReactNode;
  onSelect?: (e: Event) => void;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
};

export function KebabItem({
  icon,
  children,
  onSelect,
  onClick,
  disabled,
  destructive,
  className,
}: KebabItemProps) {
  return (
    <DropdownMenuItem
      disabled={disabled}
      onSelect={onSelect}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 h-9 text-[13px] cursor-pointer rounded-none",
        destructive
          ? "text-[#DC2626] focus:bg-[#FEF2F2] focus:text-[#B91C1C]"
          : "text-[#374151] focus:bg-[#F3F4F6] focus:text-[#1A2332]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{ fontWeight: 500 }}
    >
      {icon ? (
        <span
          className={cn(
            "material-icons flex-shrink-0",
            destructive ? "text-[#DC2626]" : "text-[#6B7280]"
          )}
          style={{ fontSize: "18px" }}
        >
          {icon}
        </span>
      ) : (
        <span className="w-[18px] flex-shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1 leading-none">{children}</span>
    </DropdownMenuItem>
  );
}

export function KebabSeparator() {
  return <DropdownMenuSeparator className="my-1 bg-[#E5E7EB]" />;
}
