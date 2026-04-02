import type { SVGProps } from "react";

export type AppIconName =
  | "home"
  | "artist"
  | "project"
  | "track"
  | "tag"
  | "admin"
  | "plus"
  | "note"
  | "notebook"
  | "pencil"
  | "trash";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ className = "h-4 w-4", children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function AppIcon({ name, className, ...props }: { name: AppIconName } & IconProps) {
  if (name === "home") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M10 20v-5.5h4V20" />
      </BaseIcon>
    );
  }

  if (name === "artist") {
    return (
      <BaseIcon className={className} {...props}>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5 19c1.3-3 4-4.5 7-4.5s5.7 1.5 7 4.5" />
      </BaseIcon>
    );
  }

  if (name === "project") {
    return (
      <BaseIcon className={className} {...props}>
        <rect x="4.5" y="4.5" width="6" height="6" rx="1.2" />
        <rect x="13.5" y="4.5" width="6" height="6" rx="1.2" />
        <rect x="4.5" y="13.5" width="6" height="6" rx="1.2" />
        <rect x="13.5" y="13.5" width="6" height="6" rx="1.2" />
      </BaseIcon>
    );
  }

  if (name === "track") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M6 7.5h12" />
        <path d="M6 12h12" />
        <path d="M6 16.5h12" />
        <circle cx="4" cy="7.5" r=".75" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r=".75" fill="currentColor" stroke="none" />
        <circle cx="4" cy="16.5" r=".75" fill="currentColor" stroke="none" />
      </BaseIcon>
    );
  }

  if (name === "tag") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M11 4.5H5.75A1.75 1.75 0 0 0 4 6.25v5.1c0 .46.18.9.5 1.23l6.92 6.92a1.75 1.75 0 0 0 2.47 0l5.61-5.61a1.75 1.75 0 0 0 0-2.47l-6.92-6.92A1.73 1.73 0 0 0 11 4.5Z" />
        <circle cx="7.75" cy="8.25" r="1.1" fill="currentColor" stroke="none" />
      </BaseIcon>
    );
  }

  if (name === "note") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M9.75 8.25v7.5" />
        <path d="M15.75 6.5v7.5" />
        <path d="M9.75 8.25 15.75 6.5" />
        <path d="M9.75 10.1 15.75 8.35" />
        <ellipse
          cx="8.85"
          cy="17.3"
          rx="2.8"
          ry="2.15"
          transform="rotate(-20 8.85 17.3)"
          fill="currentColor"
          stroke="none"
        />
        <ellipse
          cx="14.85"
          cy="15.55"
          rx="2.8"
          ry="2.15"
          transform="rotate(-20 14.85 15.55)"
          fill="currentColor"
          stroke="none"
        />
      </BaseIcon>
    );
  }

  if (name === "notebook") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M6.5 4.75h9.75a2.5 2.5 0 0 1 2.5 2.5v11.5H9.25a2.75 2.75 0 0 0-2.75 2.75V7.25a2.5 2.5 0 0 1 2.5-2.5Z" />
        <path d="M6.5 7.25H4.75v11.5H15" />
        <path d="M9.5 9h6" />
        <path d="M9.5 12.25h6" />
        <path d="M9.5 15.5h4.25" />
      </BaseIcon>
    );
  }

  if (name === "plus") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </BaseIcon>
    );
  }

  if (name === "pencil") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="m4.75 19.25 3.35-.55 9.3-9.3-2.8-2.8-9.3 9.3-.55 3.35Z" />
        <path d="m13.9 5.9 2.8 2.8" />
      </BaseIcon>
    );
  }

  if (name === "trash") {
    return (
      <BaseIcon className={className} {...props}>
        <path d="M4.75 7.5h14.5" />
        <path d="M9.5 3.75h5" />
        <path d="M7 7.5V18a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7.5" />
        <path d="M10 10.5v5" />
        <path d="M14 10.5v5" />
      </BaseIcon>
    );
  }

  return (
    <BaseIcon className={className} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <path d="M12 16.5v2" />
    </BaseIcon>
  );
}
