import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import { ColumnSettingsIcon } from "./column-settings-icon";
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
        className={cn(
          "min-w-[185px] p-0.5 bg-white border border-[#E5E7EB] rounded-lg",
          contentClassName
        )}
        style={{
          boxShadow:
            "0px 4px 6px -1px rgba(0,0,0,0.10), 0px 2px 4px -2px rgba(0,0,0,0.10)",
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type KebabItemProps = {
  icon?: string | React.ReactNode; // material-icons name, or custom icon
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
  const iconNode = React.isValidElement(icon) ? (
    icon
  ) : icon === "view_column" || icon === "tab_unselected" ? (
    <ColumnSettingsIcon className="h-5 w-5 text-[#6B7280]" />
  ) : icon ? (
    <span
      className={cn(
        "material-icons flex-shrink-0",
        destructive ? "text-[#DC2626]" : "text-[#6B7280]"
      )}
      style={{ fontSize: "20px" }}
    >
      {icon}
    </span>
  ) : null;

  return (
    <DropdownMenuItem
      disabled={disabled}
      onSelect={onSelect}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md cursor-pointer",
        destructive
          ? "text-[#DC2626] focus:bg-[#FEF2F2] focus:text-[#B91C1C]"
          : "text-[#1A2332] focus:bg-[#F5F7FA] focus:text-[#1A2332]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        height: 32,
        minHeight: 32,
        paddingTop: 5.5,
        paddingBottom: 5.5,
        paddingLeft: 8,
        paddingRight: 8,
        fontFamily: "Geist, sans-serif",
        fontWeight: 400,
        fontSize: 14,
        lineHeight: "20px",
        borderRadius: 6,
      }}
    >
      {iconNode ? (
        <span className="h-5 w-5 flex-shrink-0 inline-flex items-center justify-center">
          {iconNode}
        </span>
      ) : (
        <span className="w-5 flex-shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1 leading-[20px]">{children}</span>
    </DropdownMenuItem>
  );
}

export function KebabSeparator() {
  return (
    <DropdownMenuSeparator
      className="bg-[#E5E7EB] rounded-md"
      style={{ height: 1, marginTop: 4, marginBottom: 4, marginLeft: 0, marginRight: 0 }}
    />
  );
}
