type IconName = "arrow" | "search" | "pin" | "shield" | "plus" | "heart" | "digestive" | "eye" | "child" | "tooth" | "menu" | "close";
const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  plus: <path d="M12 4v16M4 12h16" />,
  heart: <><path d="M12 21 3.7 12.7C-2 7 6 0 12 6c6-6 14 1 8.3 6.7L12 21Z" /><path d="M3 12h5l2-4 3 8 2-4h6" /></>,
  digestive: <path d="M10 2v6c0 3-4 2-4 6a5 5 0 0 0 5 5h4a6 6 0 0 0 6-6V9c0-5-6-6-7-2-1 3-1-2-1-5M6 18c-4 0-4 4-1 4" />,
  eye: <><path d="M2 12s4-7 10-7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  child: <><circle cx="12" cy="5" r="3" /><path d="m5 10 7 3 7-3M12 13v4m-5 5 5-5 5 5" /></>,
  tooth: <path d="M12 5C6-1 1 5 4 12c2 4 1 9 4 9 2 0 1-7 4-7s2 7 4 7c3 0 2-5 4-9 3-7-2-13-8-7Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
