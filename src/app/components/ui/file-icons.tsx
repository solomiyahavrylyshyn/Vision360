import * as React from "react";

const FILE_BODY = "M5.00016 18.3333C4.55814 18.3333 4.13421 18.1577 3.82165 17.8452C3.50909 17.5326 3.3335 17.1087 3.3335 16.6667V3.33333C3.3335 2.8913 3.50909 2.46738 3.82165 2.15481C4.13421 1.84225 4.55814 1.66666 5.00016 1.66666H11.6668C11.9306 1.66623 12.1919 1.71799 12.4356 1.81897C12.6793 1.91994 12.9006 2.06813 13.0868 2.25499L16.0768 5.24499C16.2642 5.43125 16.4128 5.65278 16.5141 5.89679C16.6153 6.14081 16.6673 6.40247 16.6668 6.66666V16.6667C16.6668 17.1087 16.4912 17.5326 16.1787 17.8452C15.8661 18.1577 15.4422 18.3333 15.0002 18.3333H5.00016Z";
const FILE_FOLD = "M11.6665 1.66666V5.83332C11.6665 6.05434 11.7543 6.2663 11.9106 6.42258C12.0669 6.57886 12.2788 6.66666 12.4998 6.66666H16.6665";

/** File with upward arrow — used for Import (file_upload) */
export function FileUpIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d={FILE_BODY} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={FILE_FOLD} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* shaft */}
      <path d="M10 15V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* arrowhead pointing up */}
      <path d="M7.5 12.5L10 10L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Two overlapping document sheets — used for Copy/Duplicate (content_copy).
 * Derived from Figma "copy" vectors:
 *   back sheet:  (1.67, 1.67) → (13.33, 13.33)  [left=8.33%, top=8.33%, right=33.33%, bottom=33.33%]
 *   front sheet: (6.67, 6.67) → (18.33, 18.33)  [left=33.33%, top=33.33%, right=8.33%, bottom=8.33%]
 */
export function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* back sheet (top-left) — white fill so front sheet clips it cleanly */}
      <rect x="1.667" y="1.667" width="11.667" height="11.667" rx="1.5"
        fill="white" stroke="currentColor" strokeWidth="1.2" />
      {/* front sheet (bottom-right) — white fill covers back sheet's interior */}
      <rect x="6.667" y="6.667" width="11.667" height="11.667" rx="1.5"
        fill="white" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/** File with downward arrow — used for Export (file_download) */
export function FileDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d={FILE_BODY} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={FILE_FOLD} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* shaft */}
      <path d="M10 10V15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* arrowhead pointing down */}
      <path d="M7.5 12.5L10 15L12.5 12.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
