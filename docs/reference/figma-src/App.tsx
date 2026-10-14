import { useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard, CalendarCheck, Users, ClipboardList, CalendarDays, Bell,
  Search, Plus, ChevronLeft, ChevronRight, Phone, Megaphone, Volume2, X, Check,
  RefreshCw, TriangleAlert, CircleCheck, Clock, DoorOpen, ArrowRight, Cross,
  UserRound, Pencil, Ban, HeartPulse, FileText, CalendarX2, CalendarClock,
} from "lucide-react";

/* ───────────────────────── types & data ───────────────────────── */
type Screen = "dashboard" | "reservations" | "patients" | "queue" | "schedule" | "notices";
type Service = "ok" | "down" | "recovering";
type ApptStatus = "예약확정" | "변경됨" | "취소됨" | "내원완료";
type Stage = "접수대기" | "진료대기" | "진료중" | "진료완료";

const TODAY = "2026-10-06";
const DEPTS = ["내과", "정형외과", "소아청소년과", "피부과", "이비인후과"] as const;
const DOCTORS: { name: string; dept: string; room: string }[] = [
  { name: "김민준", dept: "내과", room: "내과 1진료실" },
  { name: "오세린", dept: "내과", room: "내과 2진료실" },
  { name: "이서연", dept: "정형외과", room: "정형외과 진료실" },
  { name: "박지훈", dept: "소아청소년과", room: "소아과 진료실" },
  { name: "최유진", dept: "피부과", room: "피부과 진료실" },
  { name: "정하은", dept: "이비인후과", room: "이비인후과 진료실" },
];
const roomOf = (doc: string) => DOCTORS.find((d) => d.name === doc)?.room ?? "";

type Patient = { id: string; name: string; sex: "남" | "여"; age: number; birth: string; phone: string; address: string; guardian?: string; note?: string; last: string };
const PATIENTS: Patient[] = [
  { id: "P-240318", name: "이순자", sex: "여", age: 72, birth: "1954.03.18", phone: "010-2841-7730", address: "서울 강동구 천호대로 1042", note: "고혈압 약 복용 중 · 페니실린 알레르기", last: "2026.10.06" },
  { id: "P-250102", name: "박도윤", sex: "남", age: 7, birth: "2019.01.02", phone: "010-5521-0912", address: "서울 송파구 올림픽로 35길 12", guardian: "박진영(부)", last: "2026.10.06" },
  { id: "P-231125", name: "김영철", sex: "남", age: 58, birth: "1968.11.25", phone: "010-3374-1188", address: "경기 하남시 미사대로 520", note: "당뇨 · 정기 혈당 체크", last: "2026.10.06" },
  { id: "P-260411", name: "최수빈", sex: "여", age: 29, birth: "1997.04.11", phone: "010-9012-4476", address: "서울 광진구 능동로 120", last: "2026.09.29" },
  { id: "P-220907", name: "정태식", sex: "남", age: 64, birth: "1962.09.07", phone: "010-7745-3021", address: "서울 강동구 성내로 6길 8", note: "무릎 관절염 · 물리치료 병행", last: "2026.10.06" },
  { id: "P-250730", name: "한지우", sex: "여", age: 5, birth: "2021.07.30", phone: "010-6638-2750", address: "서울 강동구 양재대로 1360", guardian: "한소영(모)", last: "2026.10.02" },
  { id: "P-210516", name: "윤미경", sex: "여", age: 46, birth: "1980.05.16", phone: "010-4410-9983", address: "경기 구리시 경춘로 244", last: "2026.10.06" },
  { id: "P-241009", name: "강민호", sex: "남", age: 35, birth: "1991.10.09", phone: "010-2209-6641", address: "서울 강동구 상일로 97", last: "2026.09.18" },
  { id: "P-230214", name: "임서현", sex: "여", age: 38, birth: "1988.02.14", phone: "010-8830-5217", address: "서울 송파구 중대로 140", note: "임신 20주", last: "2026.10.06" },
  { id: "P-200821", name: "오세훈", sex: "남", age: 52, birth: "1974.08.21", phone: "010-3101-7742", address: "서울 강동구 동남로 71길", last: "2026.09.25" },
  { id: "P-250318", name: "송가은", sex: "여", age: 16, birth: "2010.03.18", phone: "010-5589-1404", address: "서울 강동구 풍성로 55", guardian: "송미란(모)", last: "2026.10.06" },
  { id: "P-190609", name: "배정수", sex: "남", age: 69, birth: "1957.06.09", phone: "010-2774-8890", address: "서울 강동구 고덕로 210", note: "만성 비염", last: "2026.10.06" },
];
const pById = (id: string) => PATIENTS.find((p) => p.id === id)!;

type Appt = { id: string; date: string; time: string; pid: string; dept: string; doctor: string; kind: string; status: ApptStatus; memo?: string };
const TEMPLATE: Omit<Appt, "id" | "date">[] = [
  { time: "09:00", pid: "P-240318", dept: "내과", doctor: "김민준", kind: "재진", status: "내원완료", memo: "혈압 확인" },
  { time: "09:20", pid: "P-250102", dept: "소아청소년과", doctor: "박지훈", kind: "재진", status: "내원완료" },
  { time: "09:30", pid: "P-231125", dept: "내과", doctor: "오세린", kind: "재진", status: "내원완료", memo: "혈당 검사" },
  { time: "10:00", pid: "P-220907", dept: "정형외과", doctor: "이서연", kind: "재진", status: "내원완료" },
  { time: "10:30", pid: "P-210516", dept: "피부과", doctor: "최유진", kind: "초진", status: "내원완료" },
  { time: "11:00", pid: "P-230214", dept: "내과", doctor: "김민준", kind: "초진", status: "예약확정" },
  { time: "11:20", pid: "P-250318", dept: "이비인후과", doctor: "정하은", kind: "초진", status: "변경됨", memo: "14:40 → 11:20 변경" },
  { time: "11:40", pid: "P-190609", dept: "이비인후과", doctor: "정하은", kind: "재진", status: "예약확정" },
  { time: "13:30", pid: "P-250730", dept: "소아청소년과", doctor: "박지훈", kind: "초진", status: "예약확정", memo: "예방접종 상담" },
  { time: "14:00", pid: "P-260411", dept: "피부과", doctor: "최유진", kind: "재진", status: "취소됨", memo: "환자 요청 취소" },
  { time: "14:30", pid: "P-241009", dept: "정형외과", doctor: "이서연", kind: "초진", status: "예약확정" },
  { time: "15:00", pid: "P-200821", dept: "내과", doctor: "오세린", kind: "재진", status: "변경됨", memo: "10.08 → 10.06 변경" },
  { time: "15:30", pid: "P-220907", dept: "정형외과", doctor: "이서연", kind: "재진", status: "예약확정", memo: "물리치료 병행" },
  { time: "16:00", pid: "P-210516", dept: "내과", doctor: "김민준", kind: "재진", status: "예약확정" },
];
const shiftDate = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const buildAppts = (): Appt[] => {
  const out: Appt[] = [];
  for (let off = -2; off <= 3; off++) {
    const date = shiftDate(TODAY, off);
    const rows = off === 0 ? TEMPLATE : TEMPLATE.filter((_, i) => (i + off + 6) % 2 === 0);
    rows.forEach((r, i) => {
      const status: ApptStatus = off === 0 ? r.status : off < 0 ? (i % 5 === 3 ? "취소됨" : "내원완료") : i % 5 === 3 ? "변경됨" : "예약확정";
      out.push({ ...r, id: `${date}-${i}`, date, status });
    });
  }
  return out;
};
const dateLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${"일월화수목금토"[d.getDay()]})`;
};

type QItem = { id: string; pid: string; apptTime: string; arrive: string; dept: string; doctor: string; stage: Stage; called?: boolean; note?: string };
const QUEUE0: QItem[] = [
  { id: "q1", pid: "P-230214", apptTime: "11:00", arrive: "10:52", dept: "내과", doctor: "김민준", stage: "접수대기" },
  { id: "q2", pid: "P-250318", apptTime: "11:20", arrive: "11:05", dept: "이비인후과", doctor: "정하은", stage: "접수대기", note: "예약 시간 변경 환자" },
  { id: "q3", pid: "P-190609", apptTime: "11:40", arrive: "11:12", dept: "이비인후과", doctor: "정하은", stage: "접수대기" },
  { id: "q4", pid: "P-210516", apptTime: "10:30", arrive: "10:21", dept: "피부과", doctor: "최유진", stage: "진료대기" },
  { id: "q5", pid: "P-220907", apptTime: "10:00", arrive: "09:48", dept: "정형외과", doctor: "이서연", stage: "진료대기", called: true },
  { id: "q6", pid: "P-231125", apptTime: "09:30", arrive: "09:25", dept: "내과", doctor: "오세린", stage: "진료중" },
  { id: "q7", pid: "P-250102", apptTime: "09:20", arrive: "09:10", dept: "소아청소년과", doctor: "박지훈", stage: "진료중", note: "보호자 동행" },
  { id: "q8", pid: "P-240318", apptTime: "09:00", arrive: "08:50", dept: "내과", doctor: "김민준", stage: "진료완료" },
];
const STAGES: Stage[] = ["접수대기", "진료대기", "진료중", "진료완료"];

type Notice = { id: string; kind: "변경" | "취소" | "공지"; title: string; body: string; time: string; unread: boolean };
const NOTICES0: Notice[] = [
  { id: "n1", kind: "변경", title: "송가은 님 예약 시간 변경", body: "이비인후과 정하은 · 14:40 → 11:20 (환자 요청)", time: "10분 전", unread: true },
  { id: "n2", kind: "취소", title: "최수빈 님 예약 취소", body: "피부과 최유진 · 오늘 14:00 · 개인 사정", time: "32분 전", unread: true },
  { id: "n3", kind: "변경", title: "오세훈 님 예약 날짜 변경", body: "내과 오세린 · 10.08 → 오늘 15:00", time: "1시간 전", unread: true },
  { id: "n4", kind: "공지", title: "10월 독감 예방접종 안내", body: "10.14(화)부터 소아청소년과·내과 접종 예약을 받습니다. 접수 시 안내 부탁드립니다.", time: "오늘 08:30", unread: false },
  { id: "n5", kind: "공지", title: "10.09(목) 한글날 휴진 안내", body: "전 진료과 휴진입니다. 전화 문의 시 응급실 연계 번호를 안내해 주세요.", time: "어제", unread: false },
  { id: "n6", kind: "취소", title: "한지우 님 예약 취소", body: "소아청소년과 박지훈 · 10.03 · 보호자 요청", time: "10.03", unread: false },
];

/* ───────────────────────── small ui ───────────────────────── */
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

const STATUS_STYLE: Record<ApptStatus, string> = {
  예약확정: "bg-brand-50 text-brand-700 ring-brand-200",
  변경됨: "bg-amber-50 text-warn ring-amber-200",
  취소됨: "bg-red-50 text-danger ring-red-200",
  내원완료: "bg-emerald-50 text-ok ring-emerald-200",
};
const Chip = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ring-1 ring-inset", className)}>{children}</span>
);
const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cx("rounded-2xl border border-line bg-white", className)}>{children}</section>
);
const CardHead = ({ title, icon, right, sub }: { title: string; icon?: ReactNode; right?: ReactNode; sub?: string }) => (
  <header className="flex items-center justify-between px-5 pt-4 pb-3">
    <div className="flex items-center gap-2">
      {icon && <span className="text-brand-600">{icon}</span>}
      <h3 className="text-[16px] font-semibold">{title}</h3>
      {sub && <span className="text-[13px] text-ink-400">{sub}</span>}
    </div>
    {right}
  </header>
);
const Avatar = ({ name, sex, size = 36 }: { name: string; sex: "남" | "여"; size?: number }) => (
  <span
    className={cx("grid shrink-0 place-items-center rounded-full font-semibold", sex === "여" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-700")}
    style={{ width: size, height: size, fontSize: size * 0.4 }}
  >
    {name[0]}
  </span>
);
const Btn = ({ children, onClick, variant = "ghost", className, disabled }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "soft" | "danger"; className?: string; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cx(
      "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[14px] font-medium transition-colors disabled:opacity-40",
      variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
      variant === "ghost" && "border border-line bg-white text-ink-700 hover:bg-canvas",
      variant === "soft" && "bg-brand-50 text-brand-700 hover:bg-brand-100",
      variant === "danger" && "border border-red-200 bg-white text-danger hover:bg-red-50",
      className
    )}
  >
    {children}
  </button>
);
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-[13px] font-medium text-ink-500">{label}</span>
    {children}
  </label>
);
const inputCls = "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100";
const SearchBox = ({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) => (
  <div className={cx("relative", className)}>
    <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cx(inputCls, "pl-10")} />
  </div>
);

/* ───────────────────────── service status ───────────────────────── */
const SERVICE: Record<Service, { label: string; desc: string; dot: string; tone: string; icon: ReactNode }> = {
  ok: { label: "서비스 정상", desc: "예약·접수 시스템이 정상 운영 중입니다.", dot: "bg-ok pulse-ok", tone: "text-ok", icon: <CircleCheck size={16} /> },
  down: { label: "일시적 장애", desc: "예약 등록·변경이 지연될 수 있습니다.", dot: "bg-danger", tone: "text-danger", icon: <TriangleAlert size={16} /> },
  recovering: { label: "복구 진행 중", desc: "서비스를 복구하고 있습니다. 잠시만 기다려 주세요.", dot: "bg-warn", tone: "text-warn", icon: <RefreshCw size={16} className="spin-slow" /> },
};

function ServiceCard({ state, setState }: { state: Service; setState: (s: Service) => void }) {
  const s = SERVICE[state];
  return (
    <div className="w-[300px] rounded-2xl border border-line bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-ink-400">서비스 상태</span>
        <span className="num text-[12px] text-ink-400">11:24 확인</span>
      </div>
      <div className={cx("mt-1.5 flex items-center gap-2 text-[16px] font-semibold", s.tone)}>
        <span className={cx("h-2.5 w-2.5 rounded-full", s.dot)} />
        {s.label}
      </div>
      <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{s.desc}</p>
      <div className="mt-2.5 flex gap-1 rounded-lg bg-canvas p-0.5" role="group" aria-label="서비스 상태 미리보기">
        {(["ok", "down", "recovering"] as Service[]).map((k) => (
          <button
            key={k}
            onClick={() => setState(k)}
            className={cx("flex-1 rounded-md py-1 text-[11.5px] font-medium transition", state === k ? "bg-white text-ink-900 shadow-sm" : "text-ink-400 hover:text-ink-700")}
          >
            {k === "ok" ? "정상" : k === "down" ? "장애" : "복구 중"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceBanner({ state }: { state: Service }) {
  if (state === "ok") return null;
  const down = state === "down";
  return (
    <div className={cx("rise mb-5 flex items-center gap-3 rounded-2xl border px-5 py-3.5", down ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}>
      <span className={cx("grid h-9 w-9 place-items-center rounded-full bg-white", down ? "text-danger" : "text-warn")}>{SERVICE[state].icon}</span>
      <div className="flex-1">
        <p className={cx("text-[15px] font-semibold", down ? "text-danger" : "text-warn")}>
          {down ? "예약 서비스에 일시적인 장애가 발생했습니다" : "예약 서비스를 복구하고 있습니다"}
        </p>
        <p className="text-[13.5px] text-ink-700">
          {down ? "신규 예약 등록과 변경이 지연될 수 있어요. 접수 데스크에서 수기 접수로 안내해 주세요." : "조회는 가능하며 등록·변경은 복구 후 다시 시도해 주세요. 예상 소요 약 10분."}
        </p>
      </div>
      <Chip className="bg-white text-ink-700 ring-line">원무과 내선 214</Chip>
    </div>
  );
}

/* ───────────────────────── shell ───────────────────────── */
const NAV: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "업무현황", icon: <LayoutDashboard size={20} /> },
  { id: "reservations", label: "예약 관리", icon: <CalendarCheck size={20} /> },
  { id: "patients", label: "환자 관리", icon: <Users size={20} /> },
  { id: "queue", label: "진료 대기", icon: <ClipboardList size={20} /> },
  { id: "schedule", label: "진료 일정", icon: <CalendarDays size={20} /> },
  { id: "notices", label: "알림", icon: <Bell size={20} /> },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [service, setService] = useState<Service>("ok");
  const [appts, setAppts] = useState<Appt[]>(buildAppts);
  const [queue, setQueue] = useState<QItem[]>(QUEUE0);
  const [notices, setNotices] = useState<Notice[]>(NOTICES0);
  const [toast, setToast] = useState<string | null>(null);
  const [selPid, setSelPid] = useState("P-240318");

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 3200);
  };
  const unread = notices.filter((n) => n.unread).length;
  const openPatient = (pid: string) => {
    setSelPid(pid);
    setScreen("patients");
  };

  return (
    <div className="flex h-screen min-w-[1280px] bg-canvas text-ink-900">
      <aside className="flex w-[236px] shrink-0 flex-col border-r border-line bg-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
            <Cross size={22} strokeWidth={2.6} />
          </span>
          <div className="leading-tight">
            <p className="text-[17px] font-bold tracking-tight">한결의원</p>
            <p className="text-[12px] text-ink-400">예약·접수 데스크</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => {
            const on = screen === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id)}
                className={cx(
                  "flex h-12 items-center gap-3 rounded-xl px-4 text-[15px] transition-colors",
                  on ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-500 hover:bg-canvas hover:text-ink-900"
                )}
              >
                {n.icon}
                <span className="flex-1 text-left">{n.label}</span>
                {n.id === "notices" && unread > 0 && <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11.5px] font-semibold text-white">{unread}</span>}
                {n.id === "queue" && <span className="num text-[12.5px] text-ink-400">{queue.filter((q) => q.stage !== "진료완료").length}</span>}
              </button>
            );
          })}
        </nav>
        <div className="m-3 flex items-center gap-3 rounded-xl bg-canvas p-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">윤</span>
          <div className="leading-tight">
            <p className="text-[14px] font-semibold">윤소희 간호사</p>
            <p className="text-[12px] text-ink-400">주간 · 접수/외래</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-line bg-white px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold tracking-tight">{NAV.find((n) => n.id === screen)!.label}</h1>
            <span className="text-[14px] text-ink-400">{dateLabel(TODAY)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={cx("flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium", SERVICE[service].tone)}>
              <span className={cx("h-2 w-2 rounded-full", SERVICE[service].dot)} />
              {SERVICE[service].label}
            </span>
            <button onClick={() => setScreen("notices")} className="relative grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-500 hover:bg-canvas" aria-label="알림">
              <Bell size={19} />
              {unread > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger" />}
            </button>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto px-8 py-6">
          <div key={screen} className="rise mx-auto max-w-[1440px]">
            {screen === "dashboard" && <Dashboard {...{ service, setService, appts, queue, notices, setScreen, openPatient }} />}
            {screen === "reservations" && <Reservations {...{ appts, setAppts, flash, service, openPatient }} />}
            {screen === "patients" && <Patients {...{ appts, selPid, setSelPid, setScreen }} />}
            {screen === "queue" && <Queue {...{ queue, setQueue, flash, openPatient }} />}
            {screen === "schedule" && <Schedule />}
            {screen === "notices" && <Notices {...{ notices, setNotices }} />}
          </div>
        </main>
      </div>

      {toast && (
        <div className="rise fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-ink-900 px-5 py-3.5 text-[14.5px] text-white shadow-xl">
          <Volume2 size={18} className="text-brand-200" />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── 1. dashboard ───────────────────────── */
function Kpi({ label, value, unit, sub, icon, tone, onClick }: { label: string; value: number; unit: string; sub: string; icon: ReactNode; tone: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-2xl border border-line bg-white p-5 text-left transition hover:border-brand-200 hover:shadow-[0_6px_20px_-12px_rgba(15,123,138,.5)]">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-ink-500">{label}</span>
        <span className={cx("grid h-9 w-9 place-items-center rounded-xl", tone)}>{icon}</span>
      </div>
      <p className="num mt-3 text-[38px] leading-none font-bold tracking-tight">
        {value}
        <span className="ml-1 text-[16px] font-medium text-ink-400">{unit}</span>
      </p>
      <p className="mt-2 text-[13px] text-ink-400">{sub}</p>
    </button>
  );
}

function Dashboard({ service, setService, appts, queue, notices, setScreen, openPatient }: { service: Service; setService: (s: Service) => void; appts: Appt[]; queue: QItem[]; notices: Notice[]; setScreen: (s: Screen) => void; openPatient: (id: string) => void }) {
  const today = appts.filter((a) => a.date === TODAY);
  const active = today.filter((a) => a.status !== "취소됨");
  const waiting = queue.filter((q) => q.stage === "접수대기" || q.stage === "진료대기");
  const upcoming = today.filter((a) => a.time >= "11:00" && (a.status === "예약확정" || a.status === "변경됨"));
  const changes = today.filter((a) => a.status === "변경됨" || a.status === "취소됨");
  const hours = ["09", "10", "11", "13", "14", "15", "16"];
  const byHour = hours.map((h) => ({ h, n: active.filter((a) => a.time.startsWith(h)).length }));
  const max = Math.max(...byHour.map((b) => b.n), 1);

  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[24px] font-bold tracking-tight">윤소희 선생님, 오늘도 수고 많으세요.</p>
          <p className="mt-1 text-[15px] text-ink-500">지금 진료 대기 {waiting.length}명, 오전 진료는 거의 마무리되고 있어요.</p>
        </div>
        <ServiceCard state={service} setState={setService} />
      </div>
      <ServiceBanner state={service} />

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="오늘 예약" value={active.length} unit="건" sub={`내원 완료 ${today.filter((a) => a.status === "내원완료").length}건`} icon={<CalendarCheck size={19} />} tone="bg-brand-50 text-brand-600" onClick={() => setScreen("reservations")} />
        <Kpi label="현재 대기 환자" value={waiting.length} unit="명" sub="접수 대기 3 · 진료 대기 2" icon={<Clock size={19} />} tone="bg-amber-50 text-warn" onClick={() => setScreen("queue")} />
        <Kpi label="진료 예정" value={upcoming.length} unit="명" sub="11:00 이후 도착 예정" icon={<HeartPulse size={19} />} tone="bg-sky-50 text-sky-700" onClick={() => setScreen("schedule")} />
        <Kpi label="변경 · 취소" value={changes.length} unit="건" sub="확인하지 않은 알림 3건" icon={<CalendarX2 size={19} />} tone="bg-red-50 text-danger" onClick={() => setScreen("notices")} />
      </div>

      <div className="mt-4 grid grid-cols-[1.35fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="현재 대기 환자" icon={<Clock size={18} />} right={<button onClick={() => setScreen("queue")} className="flex items-center gap-1 text-[13.5px] font-medium text-brand-600">진료 대기 화면 <ArrowRight size={15} /></button>} />
            <ul className="divide-y divide-line px-2 pb-2">
              {waiting.map((q) => {
                const p = pById(q.pid);
                return (
                  <li key={q.id}>
                    <button onClick={() => openPatient(p.id)} className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left hover:bg-canvas">
                      <Avatar name={p.name} sex={p.sex} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold">{p.name} <span className="ml-1 text-[13px] font-normal text-ink-400">{p.sex}/{p.age}세</span></p>
                        <p className="text-[13px] text-ink-500">{q.dept} · {q.doctor} 원장 · 예약 {q.apptTime}</p>
                      </div>
                      <Chip className={q.stage === "접수대기" ? "bg-canvas text-ink-500 ring-line" : "bg-amber-50 text-warn ring-amber-200"}>{q.stage}</Chip>
                      <span className="num w-14 text-right text-[13px] text-ink-400">{q.arrive} 도착</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHead title="시간대별 예약" sub="오늘" icon={<CalendarClock size={18} />} />
            <div className="flex h-[150px] items-end gap-4 px-6 pb-5">
              {byHour.map((b) => (
                <div key={b.h} className="flex flex-1 flex-col items-center gap-2">
                  <span className="num text-[13px] font-semibold text-ink-700">{b.n}</span>
                  <div className="flex w-full items-end rounded-lg bg-canvas" style={{ height: 80 }}>
                    <div className={cx("w-full rounded-lg", b.h === "11" ? "bg-brand-600" : "bg-brand-200")} style={{ height: `${(b.n / max) * 100}%` }} />
                  </div>
                  <span className="num text-[12.5px] text-ink-400">{b.h}시</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead title="예약 변경 · 취소 알림" icon={<Bell size={18} />} right={<button onClick={() => setScreen("notices")} className="text-[13.5px] font-medium text-brand-600">전체 보기</button>} />
            <ul className="space-y-1 px-2 pb-2">
              {notices.filter((n) => n.kind !== "공지").slice(0, 3).map((n) => (
                <li key={n.id} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-canvas">
                  <span className={cx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", n.kind === "취소" ? "bg-red-50 text-danger" : "bg-amber-50 text-warn")}>
                    {n.kind === "취소" ? <Ban size={16} /> : <Pencil size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold">{n.title}</p>
                    <p className="truncate text-[13px] text-ink-500">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-ink-400">{n.time}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHead title="다음 진료 예정" icon={<HeartPulse size={18} />} sub="11:00 이후" />
            <ol className="relative mx-5 mb-4 space-y-3.5 border-l-2 border-brand-100 pl-5">
              {upcoming.slice(0, 5).map((a) => {
                const p = pById(a.pid);
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full border-2 border-brand-600 bg-white" />
                    <div className="flex items-baseline justify-between">
                      <p className="text-[14.5px] font-semibold"><span className="num mr-2 text-brand-700">{a.time}</span>{p.name}</p>
                      <span className="text-[12.5px] text-ink-400">{a.dept}</span>
                    </div>
                    <p className="text-[13px] text-ink-500">{a.doctor} 원장 · {a.kind}{a.memo ? ` · ${a.memo}` : ""}</p>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────── 2. reservations ───────────────────────── */
function Reservations({ appts, setAppts, flash, service, openPatient }: { appts: Appt[]; setAppts: React.Dispatch<React.SetStateAction<Appt[]>>; flash: (m: string) => void; service: Service; openPatient: (id: string) => void }) {
  const [date, setDate] = useState(TODAY);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("전체");
  const [doc, setDoc] = useState("전체");
  const [modal, setModal] = useState<{ edit?: Appt } | null>(null);
  const [confirm, setConfirm] = useState<Appt | null>(null);
  const blocked = service !== "ok";

  const rows = useMemo(
    () =>
      appts
        .filter((a) => a.date === date)
        .filter((a) => dept === "전체" || a.dept === dept)
        .filter((a) => doc === "전체" || a.doctor === doc)
        .filter((a) => {
          const p = pById(a.pid);
          return !q || p.name.includes(q) || p.id.toLowerCase().includes(q.toLowerCase());
        })
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appts, date, dept, doc, q]
  );
  const dayAll = appts.filter((a) => a.date === date);
  const count = (s: ApptStatus) => dayAll.filter((a) => a.status === s).length;
  const doctorOpts = DOCTORS.filter((d) => dept === "전체" || d.dept === dept);

  return (
    <>
      <ServiceBanner state={service} />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(shiftDate(date, -1))} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white hover:bg-canvas" aria-label="이전 날"><ChevronLeft size={20} /></button>
          <div className="flex h-11 min-w-[230px] items-center justify-center rounded-xl border border-line bg-white px-4 text-[16px] font-semibold">{dateLabel(date)}</div>
          <button onClick={() => setDate(shiftDate(date, 1))} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white hover:bg-canvas" aria-label="다음 날"><ChevronRight size={20} /></button>
          <Btn onClick={() => setDate(TODAY)} variant="soft" className="h-11">오늘</Btn>
        </div>
        <Btn variant="primary" className="h-11 px-5 text-[15px]" onClick={() => setModal({})} disabled={blocked}>
          <Plus size={18} /> 예약 등록
        </Btn>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="환자명 또는 환자번호 검색" className="w-[300px]" />
        <select value={dept} onChange={(e) => { setDept(e.target.value); setDoc("전체"); }} className={cx(inputCls, "w-[170px]")}>
          <option>전체</option>
          {DEPTS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={doc} onChange={(e) => setDoc(e.target.value)} className={cx(inputCls, "w-[150px]")}>
          <option value="전체">의사 전체</option>
          {doctorOpts.map((d) => <option key={d.name}>{d.name}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2 text-[13.5px] text-ink-500">
          {(["예약확정", "변경됨", "취소됨", "내원완료"] as ApptStatus[]).map((s) => (
            <Chip key={s} className={STATUS_STYLE[s]}>{s} <b className="num">{count(s)}</b></Chip>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-[14.5px]">
          <thead>
            <tr className="border-b border-line bg-canvas/70 text-[13px] text-ink-500">
              {["시간", "환자", "환자번호", "진료과 / 의사", "구분", "상태", "메모", ""].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const p = pById(a.pid);
              const closed = a.status === "취소됨" || a.status === "내원완료";
              return (
                <tr key={a.id} className={cx("border-b border-line/70 last:border-0 hover:bg-brand-50/40", a.status === "취소됨" && "text-ink-400")}>
                  <td className="num px-5 py-3.5 font-semibold">{a.time}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => openPatient(p.id)} className="flex items-center gap-2.5 text-left hover:text-brand-700">
                      <Avatar name={p.name} sex={p.sex} size={32} />
                      <span><b className={cx("font-semibold", a.status === "취소됨" && "line-through")}>{p.name}</b> <span className="text-[12.5px] text-ink-400">{p.sex}/{p.age}</span></span>
                    </button>
                  </td>
                  <td className="num px-5 py-3.5 font-mono text-[13px] text-ink-500">{p.id}</td>
                  <td className="px-5 py-3.5">{a.dept} <span className="text-ink-400">· {a.doctor}</span></td>
                  <td className="px-5 py-3.5"><span className={cx("text-[13px]", a.kind === "초진" ? "font-semibold text-brand-700" : "text-ink-500")}>{a.kind}</span></td>
                  <td className="px-5 py-3.5"><Chip className={STATUS_STYLE[a.status]}>{a.status}</Chip></td>
                  <td className="max-w-[190px] truncate px-5 py-3.5 text-[13px] text-ink-500">{a.memo ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button disabled={closed || blocked} onClick={() => setModal({ edit: a })} className="flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-700 hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-35"><Pencil size={14} />변경</button>
                      <button disabled={closed || blocked} onClick={() => setConfirm(a)} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-[13px] font-medium text-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35"><Ban size={14} />취소</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="grid place-items-center gap-2 py-16 text-ink-400">
            <CalendarX2 size={32} />
            <p className="text-[15px]">조건에 맞는 예약이 없습니다.</p>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line bg-canvas/50 px-5 py-3 text-[13px] text-ink-500">
          <span>총 <b className="num text-ink-900">{rows.length}</b>건 표시</span>
          <span>{blocked ? "서비스 장애 중에는 등록·변경·취소가 제한됩니다." : "환자명을 누르면 환자 정보로 이동합니다."}</span>
        </div>
      </Card>

      {modal && (
        <ApptModal
          edit={modal.edit}
          defaultDate={date}
          onClose={() => setModal(null)}
          onSave={(a) => {
            setAppts((prev) => (modal.edit ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a]));
            setDate(a.date);
            setModal(null);
            flash(modal.edit ? "예약이 변경되었습니다." : "예약이 등록되었습니다.");
          }}
        />
      )}
      {confirm && (
        <Modal onClose={() => setConfirm(null)} width={420}>
          <div className="p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-danger"><Ban size={22} /></span>
            <h3 className="mt-4 text-[18px] font-bold">예약을 취소할까요?</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-500">
              {pById(confirm.pid).name} 님 · {confirm.time} · {confirm.dept} {confirm.doctor} 원장<br />취소 후에는 환자에게 안내 문자가 발송됩니다.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Btn onClick={() => setConfirm(null)}>돌아가기</Btn>
              <Btn variant="danger" onClick={() => { setAppts((p) => p.map((x) => (x.id === confirm.id ? { ...x, status: "취소됨", memo: "간호사 취소 처리" } : x))); setConfirm(null); flash("예약이 취소되었습니다."); }}>예약 취소</Btn>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose, width = 560 }: { children: ReactNode; onClose: () => void; width?: number }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-900/40 p-6 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className="rise max-h-full overflow-y-auto rounded-3xl bg-white shadow-2xl" style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ApptModal({ edit, defaultDate, onClose, onSave }: { edit?: Appt; defaultDate: string; onClose: () => void; onSave: (a: Appt) => void }) {
  const [pid, setPid] = useState(edit?.pid ?? "");
  const [ps, setPs] = useState("");
  const [dept, setDept] = useState(edit?.dept ?? DEPTS[0]);
  const [doctor, setDoctor] = useState(edit?.doctor ?? DOCTORS[0].name);
  const [date, setDate] = useState(edit?.date ?? defaultDate);
  const [time, setTime] = useState(edit?.time ?? "09:00");
  const [kind, setKind] = useState(edit?.kind ?? "재진");
  const [memo, setMemo] = useState(edit?.memo ?? "");
  const docs = DOCTORS.filter((d) => d.dept === dept);
  const matches = ps ? PATIENTS.filter((p) => p.name.includes(ps) || p.id.toLowerCase().includes(ps.toLowerCase())).slice(0, 4) : [];
  const times = Array.from({ length: 18 }, (_, i) => { const m = 9 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 === 0 ? "00" : "30"}`; }).filter((t) => t !== "12:00" && t !== "12:30");
  const p = pid ? pById(pid) : null;

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h3 className="text-[18px] font-bold">{edit ? "예약 변경" : "예약 등록"}</h3>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-canvas" aria-label="닫기"><X size={20} /></button>
      </div>
      <div className="space-y-4 px-6 py-5">
        <Field label="환자">
          {p ? (
            <div className="flex h-12 items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3.5">
              <Avatar name={p.name} sex={p.sex} size={30} />
              <span className="text-[15px] font-semibold">{p.name}</span>
              <span className="num font-mono text-[13px] text-ink-500">{p.id}</span>
              {!edit && <button onClick={() => setPid("")} className="ml-auto text-[13px] text-brand-700">변경</button>}
            </div>
          ) : (
            <div className="relative">
              <SearchBox value={ps} onChange={setPs} placeholder="환자명 또는 환자번호로 찾기" />
              {matches.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                  {matches.map((m) => (
                    <li key={m.id}><button onClick={() => setPid(m.id)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-canvas"><Avatar name={m.name} sex={m.sex} size={28} /><span className="font-medium">{m.name}</span><span className="font-mono text-[12.5px] text-ink-400">{m.id}</span><span className="ml-auto text-[12.5px] text-ink-400">{m.sex}/{m.age}세</span></button></li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="진료과">
            <select className={inputCls} value={dept} onChange={(e) => { setDept(e.target.value); setDoctor(DOCTORS.find((d) => d.dept === e.target.value)!.name); }}>
              {DEPTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="담당 의사">
            <select className={inputCls} value={doctor} onChange={(e) => setDoctor(e.target.value)}>
              {docs.map((d) => <option key={d.name}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="예약 날짜"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="예약 시간">
            <select className={cx(inputCls, "num")} value={time} onChange={(e) => setTime(e.target.value)}>
              {times.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="진료 구분">
          <div className="flex gap-2">
            {["초진", "재진"].map((k) => (
              <button key={k} onClick={() => setKind(k)} className={cx("h-11 flex-1 rounded-xl border text-[15px] font-medium transition", kind === k ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-ink-500 hover:bg-canvas")}>{k}</button>
            ))}
          </div>
        </Field>
        <Field label="메모 (선택)"><input className={inputCls} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 보호자 동행, 검사 결과 상담" /></Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
        <Btn onClick={onClose}>닫기</Btn>
        <Btn variant="primary" disabled={!pid} onClick={() => onSave({ id: edit?.id ?? `new-${Date.now()}`, date, time, pid, dept, doctor, kind, memo: memo || undefined, status: edit ? "변경됨" : "예약확정" })}>
          <Check size={17} /> {edit ? "변경 저장" : "예약 등록"}
        </Btn>
      </div>
    </Modal>
  );
}

/* ───────────────────────── 3. patients ───────────────────────── */
function Patients({ appts, selPid, setSelPid, setScreen }: { appts: Appt[]; selPid: string; setSelPid: (id: string) => void; setScreen: (s: Screen) => void }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"info" | "history">("info");
  const list = PATIENTS.filter((p) => !q || p.name.includes(q) || p.id.toLowerCase().includes(q.toLowerCase()) || p.phone.replace(/-/g, "").includes(q.replace(/-/g, "")));
  const p = pById(selPid);
  const mine = appts.filter((a) => a.pid === p.id).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const future = mine.filter((a) => a.date >= TODAY && (a.status === "예약확정" || a.status === "변경됨"));
  const visits = mine.filter((a) => a.status === "내원완료");
  const records = [
    { d: "2026.08.18", dept: visits[0]?.dept ?? "내과", doc: visits[0]?.doctor ?? "김민준", note: "정기 경과 관찰, 처방 유지" },
    { d: "2026.06.30", dept: visits[0]?.dept ?? "내과", doc: visits[0]?.doctor ?? "김민준", note: "증상 호전, 약물 용량 조정" },
    { d: "2026.03.12", dept: visits[0]?.dept ?? "내과", doc: visits[0]?.doctor ?? "김민준", note: "초진 · 기본 검사 시행" },
  ];

  return (
    <div className="grid grid-cols-[360px_1fr] gap-5">
      <Card className="flex h-[calc(100vh-148px)] flex-col overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <SearchBox value={q} onChange={setQ} placeholder="이름 · 환자번호 · 연락처" />
          <p className="text-[13px] text-ink-500">환자 <b className="num text-ink-900">{list.length}</b>명</p>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {list.map((x) => (
            <li key={x.id}>
              <button onClick={() => setSelPid(x.id)} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition", x.id === selPid ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-canvas")}>
                <Avatar name={x.name} sex={x.sex} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{x.name} <span className="ml-1 text-[13px] font-normal text-ink-400">{x.sex}/{x.age}세</span></p>
                  <p className="num font-mono text-[12.5px] text-ink-400">{x.id}</p>
                </div>
                <span className="text-[12px] text-ink-400">{x.last.slice(5)}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <p className="py-12 text-center text-[14px] text-ink-400">검색 결과가 없습니다.</p>}
        </ul>
      </Card>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-start gap-5">
            <Avatar name={p.name} sex={p.sex} size={72} />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-[26px] font-bold tracking-tight">{p.name}</h2>
                <span className="text-[15px] text-ink-500">{p.sex} · {p.age}세 · {p.birth}</span>
                {p.guardian && <Chip className="bg-sky-50 text-sky-700 ring-sky-200">보호자 {p.guardian}</Chip>}
              </div>
              <p className="num mt-1 font-mono text-[14px] text-ink-500">환자번호 {p.id}</p>
              {p.note && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[14px] text-ink-700">
                  <TriangleAlert size={16} className="shrink-0 text-warn" /> {p.note}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Btn><Phone size={16} /> 연락하기</Btn>
              <Btn variant="primary" onClick={() => setScreen("reservations")}><Plus size={17} /> 예약 등록</Btn>
            </div>
          </div>
          <div className="mt-6 flex gap-1 border-b border-line">
            {([["info", "기본정보", <UserRound size={17} key="a" />], ["history", "예약 · 진료 이력", <FileText size={17} key="b" />]] as const).map(([k, l, ic]) => (
              <button key={k} onClick={() => setTab(k)} className={cx("-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-medium transition", tab === k ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-900")}>{ic}{l}</button>
            ))}
          </div>

          {tab === "info" ? (
            <dl className="mt-5 grid grid-cols-2 gap-x-10 gap-y-5">
              {[["성명", p.name], ["성별 / 나이", `${p.sex} / 만 ${p.age}세`], ["생년월일", p.birth], ["연락처", p.phone], ["주소", p.address], ["보호자", p.guardian ?? "—"], ["최근 내원일", p.last], ["특이사항", p.note ?? "없음"]].map(([k, v]) => (
                <div key={k} className="border-b border-line/70 pb-3">
                  <dt className="text-[13px] text-ink-400">{k}</dt>
                  <dd className="mt-1 text-[16px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-6">
              <div>
                <h4 className="mb-3 text-[15px] font-semibold">예약 내역 <span className="num text-ink-400">{mine.length}</span></h4>
                <ul className="space-y-2">
                  {mine.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                      <div className="num w-[78px] text-[13px] leading-tight text-ink-500"><b className="block text-[14px] text-ink-900">{a.date.slice(5).replace("-", ".")}</b>{a.time}</div>
                      <div className="flex-1 text-[14px]">{a.dept}<span className="block text-[12.5px] text-ink-400">{a.doctor} 원장</span></div>
                      <Chip className={STATUS_STYLE[a.status]}>{a.status}</Chip>
                    </li>
                  ))}
                  {mine.length === 0 && <li className="rounded-xl bg-canvas py-8 text-center text-[14px] text-ink-400">예약 내역이 없습니다.</li>}
                </ul>
                {future.length > 0 && <p className="mt-3 text-[13px] text-brand-700">다음 예약: {future[future.length - 1].date.slice(5).replace("-", ".")} {future[future.length - 1].time}</p>}
              </div>
              <div>
                <h4 className="mb-3 text-[15px] font-semibold">진료 기록</h4>
                <ol className="relative space-y-4 border-l-2 border-brand-100 pl-5">
                  {records.map((r, i) => (
                    <li key={i} className="relative">
                      <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full bg-brand-500" />
                      <p className="num text-[13.5px] font-semibold">{r.d} <span className="ml-1 font-normal text-ink-400">{r.dept} · {r.doc}</span></p>
                      <p className="text-[14px] text-ink-700">{r.note}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ───────────────────────── 4. queue ───────────────────────── */
const STAGE_META: Record<Stage, { tone: string; dot: string; icon: ReactNode }> = {
  접수대기: { tone: "bg-slate-100 text-slate-600", dot: "bg-slate-400", icon: <ClipboardList size={17} /> },
  진료대기: { tone: "bg-amber-50 text-warn", dot: "bg-warn", icon: <Clock size={17} /> },
  진료중: { tone: "bg-brand-50 text-brand-700", dot: "bg-brand-600", icon: <HeartPulse size={17} /> },
  진료완료: { tone: "bg-emerald-50 text-ok", dot: "bg-ok", icon: <CircleCheck size={17} /> },
};

function Queue({ queue, setQueue, flash, openPatient }: { queue: QItem[]; setQueue: React.Dispatch<React.SetStateAction<QItem[]>>; flash: (m: string) => void; openPatient: (id: string) => void }) {
  const [dept, setDept] = useState("전체");
  const advance = (id: string) =>
    setQueue((qs) => qs.map((x) => (x.id === id ? { ...x, stage: STAGES[Math.min(STAGES.indexOf(x.stage) + 1, 3)], called: false } : x)));
  const call = (x: QItem) => {
    setQueue((qs) => qs.map((y) => (y.id === x.id ? { ...y, called: true } : y)));
    flash(`${pById(x.pid).name} 님을 ${roomOf(x.doctor)}으로 호출했습니다.`);
  };
  const callingNow = queue.filter((x) => x.called && x.stage === "진료대기");

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1.5 rounded-xl border border-line bg-white p-1">
          {["전체", ...DEPTS].map((d) => (
            <button key={d} onClick={() => setDept(d)} className={cx("h-9 rounded-lg px-3.5 text-[14px] font-medium transition", dept === d ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-canvas")}>{d}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[14px] text-ink-500">
          {callingNow.length > 0 && <Chip className="bg-emerald-50 text-ok ring-emerald-200"><Volume2 size={14} /> 호출 중 {callingNow.length}명</Chip>}
          <span>평균 대기 <b className="num text-ink-900">12분</b></span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((s) => {
          const items = queue.filter((x) => x.stage === s && (dept === "전체" || x.dept === dept));
          const m = STAGE_META[s];
          return (
            <section key={s} className="flex min-h-[560px] flex-col rounded-2xl border border-line bg-white/60">
              <header className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className={cx("grid h-8 w-8 place-items-center rounded-lg", m.tone)}>{m.icon}</span>
                  <h3 className="text-[16px] font-semibold">{s}</h3>
                </div>
                <span className="num grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-[13.5px] font-semibold ring-1 ring-line">{items.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
                {items.map((x, i) => {
                  const p = pById(x.pid);
                  return (
                    <article key={x.id} className={cx("rounded-xl border bg-white p-3.5 transition", x.called ? "border-ok ring-4 ring-emerald-100" : "border-line hover:border-brand-200")}>
                      <div className="flex items-center gap-2.5">
                        {s !== "진료완료" && <span className="num grid h-7 w-7 place-items-center rounded-lg bg-canvas font-mono text-[13px] font-semibold text-ink-700">{i + 1}</span>}
                        <button onClick={() => openPatient(p.id)} className="min-w-0 flex-1 text-left">
                          <p className="truncate text-[15.5px] font-semibold hover:text-brand-700">{p.name} <span className="text-[12.5px] font-normal text-ink-400">{p.sex}/{p.age}</span></p>
                        </button>
                        {x.called && <Chip className="bg-emerald-50 text-ok ring-emerald-200"><Volume2 size={12} />호출</Chip>}
                      </div>
                      <p className="mt-2 text-[13px] text-ink-500">{x.dept} · {x.doctor} 원장</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-400"><DoorOpen size={13} />{roomOf(x.doctor)}</p>
                      <div className="num mt-2 flex items-center justify-between border-t border-line/70 pt-2 text-[12.5px] text-ink-400">
                        <span>예약 {x.apptTime}</span><span>도착 {x.arrive}</span>
                      </div>
                      {x.note && <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12.5px] text-warn">{x.note}</p>}
                      {s !== "진료완료" && (
                        <div className="mt-3 flex gap-1.5">
                          {s === "진료대기" && (
                            <button onClick={() => call(x)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ok text-[14px] font-semibold text-white hover:brightness-95">
                              <Volume2 size={16} /> {x.called ? "다시 호출" : "환자 호출"}
                            </button>
                          )}
                          <button onClick={() => advance(x.id)} className={cx("flex h-10 items-center justify-center gap-1 rounded-lg text-[13.5px] font-medium", s === "진료대기" ? "border border-line px-3 text-ink-700 hover:bg-canvas" : "flex-1 bg-brand-50 text-brand-700 hover:bg-brand-100")}>
                            {s === "접수대기" ? "접수 완료" : s === "진료대기" ? "진료실 입실" : "진료 종료"}
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
                {items.length === 0 && <div className="grid flex-1 place-items-center text-[13.5px] text-ink-400">대기 환자가 없습니다.</div>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/* ───────────────────────── 5. schedule ───────────────────────── */
function Schedule() {
  const [by, setBy] = useState<"의사별" | "진료과별" | "진료실별">("의사별");
  const days = ["월", "화", "수", "목", "금", "토"];
  const pattern = (name: string, d: number): ("am" | "pm")[] => {
    const i = DOCTORS.findIndex((x) => x.name === name);
    const r: ("am" | "pm")[] = [];
    if (d === 5) return i % 2 === 0 ? ["am"] : [];
    if ((i + d) % 5 !== 4) r.push("am");
    if ((i + d) % 4 !== 3) r.push("pm");
    return r;
  };
  const rows =
    by === "의사별"
      ? DOCTORS.map((d) => ({ key: d.name, title: `${d.name} 원장`, sub: d.dept, docs: [d.name] }))
      : by === "진료과별"
        ? DEPTS.map((dp) => ({ key: dp, title: dp, sub: `의사 ${DOCTORS.filter((d) => d.dept === dp).length}명`, docs: DOCTORS.filter((d) => d.dept === dp).map((d) => d.name) }))
        : DOCTORS.map((d) => ({ key: d.room, title: d.room, sub: `${d.name} 원장`, docs: [d.name] }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
          {(["의사별", "진료과별", "진료실별"] as const).map((k) => (
            <button key={k} onClick={() => setBy(k)} className={cx("h-9 rounded-lg px-4 text-[14px] font-medium", by === k ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-canvas")}>{k}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[14px] text-ink-500">
          <ChevronLeft size={18} /> <b className="text-ink-900">10월 1주차 (10.05 – 10.10)</b> <ChevronRight size={18} />
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[220px_repeat(6,1fr)] border-b border-line bg-canvas/70 text-[13.5px] font-medium text-ink-500">
          <div className="px-5 py-3">{by}</div>
          {days.map((d, i) => (
            <div key={d} className={cx("px-3 py-3 text-center", i === 1 && "text-brand-700")}>{d} <span className="num text-ink-400">{6 + i - 1}</span>{i === 1 && <span className="ml-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[11px] text-white">오늘</span>}</div>
          ))}
        </div>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[220px_repeat(6,1fr)] border-b border-line/70 last:border-0">
            <div className="px-5 py-3.5">
              <p className="text-[15px] font-semibold">{r.title}</p>
              <p className="text-[12.5px] text-ink-400">{r.sub}</p>
            </div>
            {days.map((d, di) => (
              <div key={d} className={cx("flex flex-col gap-1.5 border-l border-line/70 p-2", di === 1 && "bg-brand-50/40")}>
                {(["am", "pm"] as const).map((half) => {
                  const on = r.docs.filter((n) => pattern(n, di).includes(half));
                  return on.length ? (
                    <div key={half} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-[12.5px] text-brand-700 ring-1 ring-brand-100">
                      <span className="num font-semibold">{half === "am" ? "09–12" : "14–18"}</span>
                      {by !== "의사별" && r.docs.length > 1 && <span className="ml-1 text-ink-500">{on.length}명</span>}
                    </div>
                  ) : (
                    <div key={half} className="rounded-lg px-2.5 py-1.5 text-center text-[12px] text-ink-400/70">휴진</div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </Card>
      <p className="mt-3 text-[13px] text-ink-400">목요일(10.09)은 한글날로 전 진료과 휴진입니다. 점심시간 12:00–14:00 제외.</p>
    </>
  );
}

/* ───────────────────────── 6. notices ───────────────────────── */
function Notices({ notices, setNotices }: { notices: Notice[]; setNotices: React.Dispatch<React.SetStateAction<Notice[]>> }) {
  const [tab, setTab] = useState<"전체" | "변경" | "취소" | "공지">("전체");
  const list = notices.filter((n) => tab === "전체" || n.kind === tab);
  const meta = { 변경: { icon: <Pencil size={17} />, tone: "bg-amber-50 text-warn", label: "예약 변경" }, 취소: { icon: <Ban size={17} />, tone: "bg-red-50 text-danger", label: "예약 취소" }, 공지: { icon: <Megaphone size={17} />, tone: "bg-brand-50 text-brand-700", label: "병원 공지" } };
  return (
    <div className="max-w-[860px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
          {(["전체", "변경", "취소", "공지"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={cx("h-9 rounded-lg px-4 text-[14px] font-medium", tab === k ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-canvas")}>{k === "전체" ? "전체" : meta[k].label}</button>
          ))}
        </div>
        <Btn onClick={() => setNotices((n) => n.map((x) => ({ ...x, unread: false })))}><Check size={16} /> 모두 읽음</Btn>
      </div>
      <Card className="divide-y divide-line overflow-hidden">
        {list.map((n) => (
          <button key={n.id} onClick={() => setNotices((all) => all.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))} className={cx("flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-canvas", n.unread && "bg-brand-50/40")}>
            <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-full", meta[n.kind].tone)}>{meta[n.kind].icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15.5px] font-semibold">{n.title}</p>
                {n.unread && <span className="h-2 w-2 rounded-full bg-danger" />}
              </div>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink-500">{n.body}</p>
            </div>
            <span className="shrink-0 text-[12.5px] text-ink-400">{n.time}</span>
          </button>
        ))}
      </Card>
    </div>
  );
}
