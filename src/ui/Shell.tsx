/** 화면 틀: 왼쪽 메뉴 + 위 머리글 (피그마 간호사 화면 shell). 사이트 배지·읽기 전용 안내 띠·알림 토스트 포함. */
import { CircleCheck, Cross, LogOut, ServerCrash, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { useAppState } from "../lib/appState";
import { ROLE_LABEL, STATUS_ROLES } from "../lib/roles";
import { dateLabel, todayKst } from "../lib/time";
import type { SystemStatus } from "../lib/types";
import { cx } from "./kit";

export type NavItem<T extends string> = { id: T; label: string; icon: ReactNode; badge?: ReactNode };

const SITE_LABEL: Record<string, string> = { hospital: "병원", aws: "AWS", krdr: "국내 DR", local: "로컬" };

/** 상단 사이트 배지: GET /system/status 가 되는 역할(원장·개발자·테스터)만 1분마다 확인한다 */
function SiteBadge() {
  const { me, setReadOnly } = useAppState();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const allowed = !!me && STATUS_ROLES.includes(me.user.role);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    const load = () =>
      api<SystemStatus>("/system/status")
        .then((s) => {
          if (!alive) return;
          setStatus(s);
          if (s.read_only_mode) setReadOnly(true);
        })
        .catch(() => alive && setStatus(null));
    load();
    const t = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [allowed, setReadOnly]);

  if (!allowed || !status) return null;
  const failing = Object.values(status.services).filter((v) => v !== "ok").length + (status.db === "ok" ? 0 : 1);
  const tone = failing ? "text-danger" : status.read_only_mode ? "text-warn" : "text-ok";
  const dot = failing ? "bg-danger" : status.read_only_mode ? "bg-warn" : "bg-ok pulse-ok";
  return (
    <span className={cx("flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium", tone)} title={`버전 ${status.version}`}>
      <span className={cx("h-2 w-2 rounded-full", dot)} />
      {SITE_LABEL[status.site] ?? status.site} 사이트
      <span className="text-ink-400">·</span>
      {failing ? `장애 ${failing}곳` : status.read_only_mode ? "읽기 전용" : "정상"}
    </span>
  );
}

/** 503 WRITE_DISABLED 를 받으면 보이는 안내 띠 (피그마 ServiceBanner 모양) */
function ReadOnlyBanner() {
  const { readOnly } = useAppState();
  if (!readOnly) return null;
  return (
    <div role="status" className="rise mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-warn"><TriangleAlert size={16} /></span>
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-warn">현재 읽기 전용 모드입니다</p>
        <p className="text-[13.5px] text-ink-700">조회는 할 수 있지만 예약·접수·등록 같은 저장은 할 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
      </div>
    </div>
  );
}

function ToastView() {
  const { toast } = useAppState();
  if (!toast) return null;
  const Icon = toast.tone === "ok" ? CircleCheck : toast.tone === "warn" ? TriangleAlert : ServerCrash;
  return (
    <div role="status" className="rise fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-ink-900 px-5 py-3.5 text-[14.5px] text-white shadow-xl">
      <Icon size={18} className={toast.tone === "ok" ? "text-brand-200" : "text-amber-300"} />
      {toast.message}
    </div>
  );
}

export function Shell<T extends string>({ subtitle, nav, active, onSelect, title, children }: {
  subtitle: string; nav: NavItem<T>[]; active: T; onSelect: (id: T) => void; title: string; children: ReactNode;
}) {
  const { me, signOut } = useAppState();
  const user = me?.user;
  return (
    <div className="flex h-screen min-w-[1180px] bg-canvas text-ink-900">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-line bg-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Cross size={22} strokeWidth={2.6} />
          </span>
          <div className="leading-tight">
            <p className="text-[17px] font-bold tracking-tight">병원 예약</p>
            <p className="text-[12px] text-ink-400">{subtitle}</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="메뉴">
          {nav.map((n) => {
            const on = active === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onSelect(n.id)}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] transition-colors",
                  on ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-500 hover:bg-canvas hover:text-ink-900",
                )}
              >
                {n.icon}
                <span className="flex-1 text-left">{n.label}</span>
                {n.badge}
              </button>
            );
          })}
        </nav>
        {user && (
          <div className="m-3 rounded-xl bg-canvas p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{user.name.slice(0, 1)}</span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[14px] font-semibold">{user.name}</p>
                <p className="text-[12px] text-ink-400">{ROLE_LABEL[user.role]}</p>
              </div>
            </div>
            <button type="button" onClick={signOut} className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white text-[13px] font-medium text-ink-700 hover:bg-white/60">
              <LogOut size={15} /> 로그아웃
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-line bg-white px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold tracking-tight">{title}</h1>
            <span className="text-[14px] text-ink-400">{dateLabel(todayKst())}</span>
          </div>
          <SiteBadge />
        </header>
        <main className="relative flex-1 overflow-y-auto px-8 py-6">
          <div key={String(active)} className="rise mx-auto max-w-[1440px]">
            <ReadOnlyBanner />
            {children}
          </div>
        </main>
      </div>
      <ToastView />
    </div>
  );
}

/** 로그인 화면처럼 메뉴 없는 화면용 */
export function Bare({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink-900">
      {children}
      <ToastView />
    </div>
  );
}
