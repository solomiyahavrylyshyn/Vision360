import * as React from "react";

type PlusIconProps = React.SVGProps<SVGSVGElement>;

export function PlusIcon({ className, ...props }: PlusIconProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M7.26667 13.9333C10.9486 13.9333 13.9333 10.9486 13.9333 7.26666C13.9333 3.58477 10.9486 0.599998 7.26667 0.599998C3.58477 0.599998 0.600006 3.58477 0.600006 7.26666C0.600006 10.9486 3.58477 13.9333 7.26667 13.9333Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.26666 4.6V9.93333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.6 7.26666H9.93333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
