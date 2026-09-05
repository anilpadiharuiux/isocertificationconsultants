import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Phone(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 005 5L14 12l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 011-2z" />
    </svg>
  );
}

export function ShieldCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function Icon({ name, ...props }: { name: string } & IconProps) {
  switch (name) {
    case "assessment":
      return (
        <svg {...base} {...props}>
          <path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
          <path d="M14 3v5h5M8 13l2.5 2.5L16 10" />
        </svg>
      );
    case "document":
      return (
        <svg {...base} {...props}>
          <path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      );
    case "audit":
      return (
        <svg {...base} {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M8.5 11l2 2 3.5-3.5" />
        </svg>
      );
    case "assistant":
      return (
        <svg {...base} {...props}>
          <path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4V5z" />
          <path d="M9 9h6M9 12h4" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...base} {...props}>
          <path d="M4 13a8 8 0 1116 0" />
          <path d="M12 13l4-3" />
          <path d="M4 18h16" />
        </svg>
      );
    case "expert":
      return (
        <svg {...base} {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
          <path d="M17 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
        </svg>
      );
    case "inspection":
      return (
        <svg {...base} {...props}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M20 20l-4.4-4.4M8 10.5l1.8 1.8L13.5 8.5" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...base} {...props}>
          <path d="M3 7l9-4 9 4-9 4-9-4z" />
          <path d="M3 7v10l9 4 9-4V7M12 11v10" />
        </svg>
      );
    case "training":
      return (
        <svg {...base} {...props}>
          <path d="M12 3l10 5-10 5L2 8l10-5z" />
          <path d="M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 8v5" />
        </svg>
      );
    case "production":
      return (
        <svg {...base} {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
      );
    case "capa":
      return (
        <svg {...base} {...props}>
          <path d="M12 3l9 16H3l9-16z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
      );
    case "supplier":
      return (
        <svg {...base} {...props}>
          <path d="M2 8h11v8H2zM13 11h5l3 3v2h-8z" />
          <circle cx="6" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      );
    case "calibration":
      return (
        <svg {...base} {...props}>
          <path d="M4 16a8 8 0 1116 0" />
          <path d="M12 16l4-4" />
          <path d="M4 16h16" />
          <path d="M8 20h8" />
        </svg>
      );
    case "design":
      return (
        <svg {...base} {...props}>
          <path d="M12 3l2 4 4 .6-3 2.9.7 4.1L12 12.6 8.6 14.6l.7-4.1-3-2.9 4-.6 1.7-4z" />
          <path d="M6 21l6-5 6 5" />
        </svg>
      );
    case "rollout":
      return (
        <svg {...base} {...props}>
          <path d="M3 12h4l2-3h6l2 3h4" />
          <rect x="3" y="12" width="18" height="7" rx="1.5" />
          <path d="M8 16h.01M12 16h.01M16 16h.01" />
        </svg>
      );
    case "loop":
      return (
        <svg {...base} {...props}>
          <path d="M4 12a8 8 0 0113.7-5.7L20 8" />
          <path d="M20 3.5V8h-4.5" />
          <path d="M20 12a8 8 0 01-13.7 5.7L4 16" />
          <path d="M4 20.5V16h4.5" />
        </svg>
      );
    case "certificate":
      return (
        <svg {...base} {...props}>
          <circle cx="12" cy="9" r="5" />
          <path d="M9 9l2 2 4-4" />
          <path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5" />
        </svg>
      );
    default:
      return <ShieldCheck {...props} />;
  }
}
