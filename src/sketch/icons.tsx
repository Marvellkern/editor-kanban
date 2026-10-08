/* Hand-drawn icons: slightly uneven strokes, round caps, drawn on a 24px grid. */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`icon ${className ?? ""}`}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.3 4.2c-.2 5.3 0 10.4-.4 15.6" />
    <path d="M4.4 12.4c5.1-.5 10.2-.2 15.3-.6" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6.6c5.4-.4 10.7-.3 16.1-.2" />
    <path d="M9.4 6.2c0-1.4.3-2.3 1.6-2.4 1.1-.1 2.3-.1 3 .3.6.4.6 1.2.6 2" />
    <path d="M6 7c.4 4.3.6 8.7 1.3 12.9.2.8.9 1.1 1.7 1.1 2.2.1 4.4.1 6.5-.1.8-.1 1.2-.6 1.3-1.4.4-4.2.7-8.4 1-12.6" />
    <path d="M10.2 10.3c.1 2.6.2 5.2.4 7.6M14 10.2c-.1 2.5-.2 5.1-.4 7.7" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.6 19.6c.4-1.6.7-3.1 1.3-4.6 3.3-3.4 6.7-6.7 10.1-10 1-.9 2.2-.8 3 .1.8.8.9 2-.1 2.9-3.3 3.4-6.7 6.7-10 10-1.4.6-2.8 1.1-4.3 1.6Z" />
    <path d="M14.4 6.6c1 .9 2 1.9 3 2.9" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.2 3.6c4.7-.2 8.4 3.6 8.2 8.3-.1 4.6-3.8 8.3-8.5 8.3-4.6 0-8.3-3.7-8.3-8.4.1-4.5 3.6-8.1 8.1-8.3" />
    <path d="M12 7.4c0 1.6.1 3.3 0 4.9 1.2.7 2.4 1.3 3.6 2" />
  </Icon>
);

export const CheckIcon = ({ animate, ...p }: IconProps & { animate?: boolean }) => (
  <Icon {...p} className={`${p.className ?? ""} ${animate ? "icon--draw" : ""}`}>
    <path pathLength={1} d="M4.3 12.6c1.7 1.6 3.3 3.4 4.8 5.3 3-4.6 6.5-8.8 10.6-12.6" />
  </Icon>
);

export const NotesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.8c3.3-.1 6.6-.2 9.8 0 1.4 1.4 2.8 2.9 4 4.4.2 3.9.1 7.8-.1 11.7-4.6.4-9.2.4-13.8.2-.4-5.4-.3-10.9.1-16.3Z" />
    <path d="M15.6 4c-.1 1.5 0 3 .1 4.5 1.4.1 2.8 0 4.2 0" />
    <path d="M8.6 12.2c2.4-.1 4.8 0 7.1-.1M8.7 15.6c1.8 0 3.6-.1 5.3 0" />
  </Icon>
);

export const DotsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.6 12.1c.4-.3.9-.2 1 .2.1.5-.4.8-.8.6-.4-.2-.4-.6-.2-.8Z" strokeWidth={2.6} />
    <path d="M11.7 11.9c.4-.3.9-.1 1 .3.1.4-.4.8-.8.6-.4-.2-.5-.6-.2-.9Z" strokeWidth={2.6} />
    <path d="M17.7 12c.4-.3.9-.1 1 .3 0 .5-.4.8-.8.6-.4-.2-.5-.6-.2-.9Z" strokeWidth={2.6} />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.4 5.2c4.4 4.5 8.8 9 13.2 13.6" />
    <path d="M18.7 5.4c-4.6 4.3-9 8.8-13.3 13.3" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.4 4.1c3.6-.1 6.3 2.6 6.2 6.1-.1 3.4-2.8 6-6.2 6-3.4 0-6.1-2.7-6.1-6.1.1-3.2 2.8-5.9 6.1-6Z" />
    <path d="M15 15c1.7 1.6 3.3 3.3 5 5" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.1 3.8c-.1 3.8 0 7.6-.2 11.4" />
    <path d="M7.6 11.3c1.5 1.4 3 2.9 4.4 4.3 1.5-1.5 3-3 4.5-4.4" />
    <path d="M4.4 16.6c0 1.2 0 2.4.2 3.6 5 .2 10 .2 15-.1.1-1.2.1-2.3.1-3.5" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15.4c.1-3.8 0-7.6.2-11.4" />
    <path d="M7.5 8.4c1.5-1.4 3-2.9 4.6-4.4 1.4 1.5 2.9 3 4.4 4.4" />
    <path d="M4.4 16.6c0 1.2 0 2.4.2 3.6 5 .2 10 .2 15-.1.1-1.2.1-2.3.1-3.5" />
  </Icon>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.6 12.2c-5-.1-10 .1-15 0" />
    <path d="M10 6.4c-1.9 1.9-3.7 3.8-5.5 5.8 1.8 1.9 3.7 3.8 5.6 5.6" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.4 12c5 .1 10-.1 15 .1" />
    <path d="M14 6.3c1.9 1.9 3.8 3.8 5.5 5.9-1.8 1.9-3.7 3.8-5.6 5.6" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.3c4.7-.3 9.3-.2 14-.5" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.8 12.2c2.4-3.9 5.6-6 9.3-6 3.6 0 6.8 2.1 9.2 5.9-2.4 3.8-5.6 5.9-9.3 5.9-3.6 0-6.8-2-9.2-5.8Z" />
    <path d="M12 9.3c1.6-.1 2.8 1.2 2.7 2.8-.1 1.5-1.3 2.6-2.8 2.6-1.5-.1-2.6-1.3-2.6-2.8.1-1.5 1.2-2.6 2.7-2.6Z" />
  </Icon>
);

/** Eye with a scribble through it: blur mode is on. */
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.8 12.2c2.4-3.9 5.6-6 9.3-6 3.6 0 6.8 2.1 9.2 5.9-2.4 3.8-5.6 5.9-9.3 5.9-3.6 0-6.8-2-9.2-5.8Z" />
    <path d="M12 9.3c1.6-.1 2.8 1.2 2.7 2.8-.1 1.5-1.3 2.6-2.8 2.6-1.5-.1-2.6-1.3-2.6-2.8.1-1.5 1.2-2.6 2.7-2.6Z" />
    <path d="M4.2 4.3c5.2 5 10.3 10.2 15.6 15.3" strokeWidth={2.4} />
  </Icon>
);

/** Small film-frame doodle used in the logo. */
export const FilmIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.2 5.4c5.2-.4 10.4-.3 15.6-.1.3 4.4.3 8.9 0 13.3-5.2.3-10.4.3-15.5 0-.4-4.4-.4-8.8-.1-13.2Z" />
    <path d="M7.8 5.6c-.1 4.3 0 8.6-.1 12.9M16.3 5.4c.1 4.4.1 8.8 0 13.2" />
    <path d="M4.4 9.2h3.2M4.3 13.1h3.3M16.4 9.1h3.3M16.4 13h3.3" />
  </Icon>
);
