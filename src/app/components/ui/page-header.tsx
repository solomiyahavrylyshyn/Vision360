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
  countSuffix = "records",
  subtitle,
  actions,
  icon,
  className,
}: PageHeaderProps) {
  const countNode =
    subtitle !== undefined ? (
      subtitle
    ) : count !== undefined ? (
      <span className="text-[15px] text-[#9AA3AF]" style={{ fontWeight: 400 }}>
        ({typeof count === "number" ? `${count} ${countSuffix}` : count})
      </span>
    ) : null;

  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <h1
        className="text-[26px] text-[#1A2332] flex items-center gap-2"
        style={{ fontWeight: 700 }}
      >
        {icon && (
          <span className="material-icons text-[#4A6FA5]" style={{ fontSize: "26px" }}>
            {icon}
          </span>
        )}
        {title}
        {countNode}
      </h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
