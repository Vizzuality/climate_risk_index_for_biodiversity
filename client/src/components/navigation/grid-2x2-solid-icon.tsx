import type { SVGProps } from "react";

export function Grid2x2SolidIcon(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
    >
      <g transform="translate(2 2)">
        <path d="M6.42851 0H10.08C11.1404 0 12 0.859623 12 1.92002V5.57149H6.42851V0Z" />
        <path d="M6.42851 6.42851H12V10.08C12 11.1404 11.1404 12 10.08 12H6.42851V6.42851Z" />
        <path d="M6.96182e-05 1.92009C6.96182e-05 0.859692 0.859693 6.96182e-05 1.92009 6.96182e-05H5.57156V5.57156H6.96182e-05V1.92009Z" />
        <path d="M0 6.42851H5.57149V12H1.92002C0.859622 12 0 11.1404 0 10.08V6.42851Z" />
      </g>
    </svg>
  );
}
