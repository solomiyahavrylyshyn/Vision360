import * as React from "react";
import { cn } from "./utils";

type PageHeaderProps = {
  title: string;
  count?: number | string;
  countSuffix?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Optional Material Icon name rendered before the title (e.g. "work", "receipt") */
  icon?: string;
  className?: string;
};

export function PageHeader({
  title,
  count,
  countSuffix = "",
  subtitle,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  const countNode =
    subtitle !== undefined ? (
      subtitle
    ) : count !== undefined ? (
      <div className="pb-0.5 flex items-center justify-center">
        <span className="text-[16px] text-[#6B7280]" style={{ fontWeight: 400, lineHeight: "24px" }}>
          ({typeof count === "number" ? (countSuffix ? `${count} ${countSuffix}` : count) : count})
        </span>
      </div>
    ) : null;

  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <div className="flex items-end gap-2">
        {icon && (
          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "24px" }}>
            {icon}
          </span>
        )}
        <h1
          className="text-[24px] text-[#1A2332]"
          style={{ fontWeight: 600, lineHeight: "32.4px" }}
        >
          {title}
        </h1>
        {countNode}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
