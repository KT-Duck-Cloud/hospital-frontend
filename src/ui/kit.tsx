/** 공통 UI. 피그마 간호사 화면(docs/reference/App.tsx)의 카드·버튼·칩·입력·표 스타일을 그대로 옮겼다. */
import { CalendarX2, Loader2, Search, ShieldAlert, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import type { ApiError } from "../lib/api";
import type { Reservation } from "../lib/types";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export const Chip = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ring-1 ring-inset", className)}>
    {children}
  </span>
);

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cx("rounded-2xl border border-line bg-white", className)}>{children}</section>
);

export const CardHead = ({ title, icon, right, sub }: { title: string; icon?: ReactNode; right?: ReactNode; sub?: ReactNode }) => (
  <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
    <div className="flex items-center gap-2">
      {icon && <span className="text-brand-600">{icon}</span>}
      <h3 className="text-[16px] font-semibold">{title}</h3>
      {sub && <span className="text-[13px] text-ink-400">{sub}</span>}
    </div>
    {right}
  </header>
);

export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-full bg-brand-50 font-semibold text-brand-700"
    style={{ width: size, height: size, fontSize: size * 0.4 }}
    aria-hidden
  >
    {name.slice(0, 1)}
  </span>
);

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "soft" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
};
export const Btn = ({ children, onClick, variant = "ghost", className, disabled, type = "button", title }: BtnProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cx(
      "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
      variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
      variant === "ghost" && "border border-line bg-white text-ink-700 hover:bg-canvas",
      variant === "soft" && "bg-brand-50 text-brand-700 hover:bg-brand-100",
      variant === "danger" && "border border-red-200 bg-white text-danger hover:bg-red-50",
      className,
    )}
  >
    {children}
  </button>
);

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-1.5 block text-[13px] font-medium text-ink-500">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[12.5px] text-ink-400">{hint}</span>}
  </label>
);

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-canvas";

export const SearchBox = ({ value, onChange, placeholder, className, onEnter }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string; onEnter?: () => void;
}) => (
  <div className={cx("relative", className)}>
    <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder={placeholder}
      className={cx(inputCls, "pl-10")}
      maxLength={50}
    />
  </div>
);

/** 탭·필터 묶음 (피그마 진료 대기 화면의 진료과 필터 모양) */
export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx("h-9 rounded-lg px-3.5 text-[14px] font-medium transition", value === o.value ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-canvas")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ children, onClose, width = 560, title }: { children: ReactNode; onClose: () => void; width?: number; title?: string }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-900/40 p-6 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="rise max-h-full overflow-y-auto rounded-3xl bg-white shadow-2xl"
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 className="text-[18px] font-bold">{title}</h3>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-canvas" aria-label="닫기">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Kpi({ label, value, unit, sub, icon, tone }: { label: string; value: number | string; unit: string; sub?: string; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-ink-500">{label}</span>
        <span className={cx("grid h-9 w-9 place-items-center rounded-xl", tone)}>{icon}</span>
      </div>
      <p className="num mt-3 text-[38px] leading-none font-bold tracking-tight">
        {value}
        <span className="ml-1 text-[16px] font-medium text-ink-400">{unit}</span>
      </p>
      {sub && <p className="mt-2 text-[13px] text-ink-400">{sub}</p>}
    </div>
  );
}

export const Loading = ({ label = "불러오는 중" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-[14px] text-ink-400">
    <Loader2 size={18} className="spin-slow" /> {label}
  </div>
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="grid place-items-center gap-2 py-14 text-ink-400">
    <CalendarX2 size={30} />
    <p className="text-[14.5px]">{children}</p>
  </div>
);

/** API 오류 안내. 403 은 "권한 없음" 으로 따로 보여 준다 (서버가 거부한 것). */
export function ErrorNotice({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  if (error.forbidden) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-white px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-ink-500"><ShieldAlert size={18} /></span>
        <div>
          <p className="text-[15px] font-semibold">권한이 없습니다</p>
          <p className="text-[13.5px] text-ink-500">서버가 이 계정의 요청을 거부했습니다 (403). 필요한 권한은 관리자에게 문의해 주세요.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
      <TriangleAlert size={18} className="shrink-0 text-danger" />
      <p className="flex-1 text-[14px] text-ink-700">{error.message}</p>
      {onRetry && <Btn onClick={onRetry}>다시 시도</Btn>}
    </div>
  );
}

/** 아직 만들지 않은 기능의 시연용 예시 표시 */
export const PlannedBadge = () => <Chip className="bg-amber-50 text-warn ring-amber-200">준비 중(시연용 예시)</Chip>;

/** 예약 상태 칩 */
export function reservationState(r: Pick<Reservation, "status" | "checkin_status">) {
  if (r.status === "CANCELED") return { label: "취소됨", cls: "bg-red-50 text-danger ring-red-200" };
  if (r.checkin_status === "CHECKED_IN") return { label: "접수완료", cls: "bg-emerald-50 text-ok ring-emerald-200" };
  if (r.checkin_status === "IN_TREATMENT") return { label: "진료중", cls: "bg-sky-50 text-brand-700 ring-sky-200" };
  if (r.checkin_status === "COMPLETED") return { label: "진료완료", cls: "bg-slate-100 text-slate-600 ring-slate-200" };
  return { label: "예약확정", cls: "bg-brand-50 text-brand-700 ring-brand-200" };
}

export const ReservationChip = ({ r }: { r: Pick<Reservation, "status" | "checkin_status"> }) => {
  const s = reservationState(r);
  return <Chip className={s.cls}>{s.label}</Chip>;
};

/** 대기열의 진료 진행 칩: 진료대기 → 진료중 → 진료완료 */
const PROGRESS: Record<Reservation["checkin_status"], { label: string; cls: string }> = {
  NOT_CHECKED_IN: { label: "접수 전", cls: "bg-brand-50 text-brand-700 ring-brand-200" },
  CHECKED_IN: { label: "진료대기", cls: "bg-amber-50 text-warn ring-amber-200" },
  IN_TREATMENT: { label: "진료중", cls: "bg-sky-50 text-brand-700 ring-sky-200" },
  COMPLETED: { label: "진료완료", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};
export const ProgressChip = ({ status }: { status: Reservation["checkin_status"] }) => (
  <Chip className={PROGRESS[status].cls}>{PROGRESS[status].label}</Chip>
);

/** 표 머리 (피그마 예약 관리 표) */
export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <th className={cx("px-5 py-3 font-medium", className)}>{children}</th>
);
export const tableHeadRow = "border-b border-line bg-canvas/70 text-[13px] text-ink-500";
export const tableRow = "border-b border-line/70 last:border-0 hover:bg-brand-50/40";
