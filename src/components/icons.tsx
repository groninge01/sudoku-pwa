type IconProps = { size?: number; className?: string };
function Icon({ size = 20, className, children }: IconProps & { children: React.ReactNode }) { return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>; }
export function PencilIcon(p: IconProps) { return <Icon {...p}><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></Icon>; }
export function CandidatesIcon(p: IconProps) { return <Icon {...p}>{[6,12,18].flatMap(x=>[6,12,18].map(y=><circle key={`${x}${y}`} cx={x} cy={y} r="1"/>))}</Icon>; }
export function EraserIcon(p: IconProps) { return <Icon {...p}><path d="m7 16 8-10 6 5-8 9H7l-4-4 9-11"/><path d="m11 20 6-7"/></Icon>; }
export function UndoIcon(p: IconProps) { return <Icon {...p}><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></Icon>; }
export function RedoIcon(p: IconProps) { return <Icon {...p}><path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/></Icon>; }
export function RestartIcon(p: IconProps) { return <Icon {...p}><path d="M20 7v5h-5"/><path d="M20 12a8 8 0 1 1-2.3-5.7L20 9"/></Icon>; }
export function GridIcon(p: IconProps) { return <Icon {...p}><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></Icon>; }
export function SunIcon(p: IconProps) { return <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></Icon>; }
export function MoonIcon(p: IconProps) { return <Icon {...p}><path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></Icon>; }
export function MonitorIcon(p: IconProps) { return <Icon {...p}><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></Icon>; }
export function GearIcon(p: IconProps) { return <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2 2-2 2-2-1.2-.1-.1a8 8 0 0 1-2 .8l-.6 2.3h-3l-.6-2.3a8 8 0 0 1-2-.8L6.3 19l-2-2 1.2-2 .1-.1a8 8 0 0 1-.8-2L2.5 12v-3l2.3-.6a8 8 0 0 1 .8-2l-.1-.1-1.2-2 2-2 2 1.2.1.1a8 8 0 0 1 2-.8L11 1.5h3l.6 2.3a8 8 0 0 1 2 .8l.1-.1 2-1.2 2 2-1.2 2-.1.1a8 8 0 0 1 .8 2l2.3.6v3l-2.3.6a8 8 0 0 1-.8 2Z"/></Icon>; }
export function CloseIcon(p: IconProps) { return <Icon {...p}><path d="m6 6 12 12M18 6 6 18"/></Icon>; }
export function CheckIcon(p: IconProps) { return <Icon {...p}><path d="m5 12 4 4L19 6"/></Icon>; }
export function LightbulbIcon(p: IconProps) { return <Icon {...p}><path d="M9 18h6m-5 3h4m-2-19a7 7 0 0 0-4 12c1 .8 1 1.5 1 2h6c0-.5 0-1.2 1-2A7 7 0 0 0 12 2Z"/></Icon>; }
export function ClockIcon(p: IconProps) { return <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>; }
export function WarningIcon(p: IconProps) { return <Icon {...p}><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5m0 3h.01"/></Icon>; }
export function PlayIcon(p: IconProps) { return <Icon {...p}><path d="m7 4 13 8-13 8V4Z"/></Icon>; }
