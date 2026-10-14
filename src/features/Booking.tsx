/**
 * 예약하기: 진료과 → 의사 → 날짜 → 30분 빈 시간 (R6·R7·R13) → 예약 (R1).
 * - X-Request-ID: 새 시도마다 새 UUID, 같은 시도를 다시 보낼 때(네트워크 오류 등)는 같은 값 (IdempotencyKey).
 * - 환자는 본인 이름으로만 예약된다 (서버가 토큰으로 채움). 직원은 환자를 먼저 고른다.
 */
import { CalendarCheck, Check, RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, toApiError, type ApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { IdempotencyKey } from "../lib/requestId";
import { addDays, kstTime, todayKst, weekday } from "../lib/time";
import type { PatientSummary, Reservation, SlotsOut } from "../lib/types";
import { useApi } from "../lib/useApi";
import { Btn, Card, cx, ErrorNotice, Field, inputCls, Loading, SearchBox } from "../ui/kit";
import { useDirectory } from "./directory";

const Step = ({ n, title, children, done }: { n: number; title: string; children: ReactNode; done?: boolean }) => (
  <div className="border-b border-line/70 px-6 py-5 last:border-0">
    <p className="mb-3 flex items-center gap-2.5 text-[15px] font-semibold">
      <span className={cx("num grid h-7 w-7 place-items-center rounded-full text-[13px]", done ? "bg-brand-600 text-white" : "bg-canvas text-ink-500")}>{n}</span>
      {title}
    </p>
    {children}
  </div>
);

const pill = (on: boolean) =>
  cx("rounded-xl border px-4 py-2.5 text-left text-[14.5px] transition", on ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-line bg-white text-ink-700 hover:bg-canvas");

function PatientPicker({ value, onChange }: { value: PatientSummary | null; onChange: (p: PatientSummary | null) => void }) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const found = useApi(term ? () => api<{ items: PatientSummary[] }>("/patients", { query: { q: term, size: 6 } }) : null, [term]);
  if (value) {
    return (
      <div className="flex h-12 items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3.5">
        <span className="text-[15px] font-semibold">{value.name}</span>
        <span className="num font-mono text-[13px] text-ink-500">{value.chart_no}</span>
        <button type="button" onClick={() => onChange(null)} className="ml-auto text-[13px] text-brand-700">변경</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <SearchBox value={q} onChange={setQ} onEnter={() => setTerm(q.trim())} placeholder="환자 이름 또는 차트번호" className="flex-1" />
        <Btn onClick={() => setTerm(q.trim())} disabled={!q.trim()}>찾기</Btn>
      </div>
      {found.error && <div className="mt-2"><ErrorNotice error={found.error} /></div>}
      {found.data && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-line">
          {found.data.items.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onChange(p)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-canvas">
                <span className="font-medium">{p.name}</span>
                <span className="font-mono text-[12.5px] text-ink-400">{p.chart_no}</span>
                <span className="ml-auto text-[12.5px] text-ink-400">{p.birth_date}</span>
              </button>
            </li>
          ))}
          {found.data.items.length === 0 && <li className="px-3.5 py-3 text-[14px] text-ink-400">찾는 환자가 없습니다.</li>}
        </ul>
      )}
    </div>
  );
}

export default function Booking({ staff = false, defaultDate, onDone }: { staff?: boolean; defaultDate?: string; onDone?: (r: Reservation) => void }) {
  const { me, flash } = useAppState();
  const dir = useDirectory();
  const today = todayKst();
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [deptId, setDeptId] = useState<number | null>(staff && me?.user.role === "NURSE" ? me.user.department_id : null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState(defaultDate ?? addDays(today, 1));
  const [slot, setSlot] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<"FIRST" | "RETURN">("FIRST");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const key = useRef(new IdempotencyKey());

  // 입력이 바뀌면 새로운 예약 시도 → 다음에 보낼 때 새 X-Request-ID
  useEffect(() => key.current.reset(), [patient, deptId, doctorId, date, slot, visitType, memo]);

  const bookable = useMemo(
    () => dir.departments.filter((d) => dir.doctors.some((doc) => doc.department_id === d.id)),
    [dir.departments, dir.doctors],
  );
  const doctors = dir.doctors.filter((d) => d.department_id === deptId);
  const slots = useApi(doctorId ? () => api<SlotsOut>("/slots", { query: { doctor_id: doctorId, date } }) : null, [doctorId, date]);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const submit = async () => {
    if (!deptId || !doctorId || !slot || (staff && !patient)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api<Reservation>("/reservations", {
        method: "POST",
        headers: { "X-Request-ID": key.current.current() },
        body: {
          ...(staff ? { patient_id: patient!.id } : {}),
          department_id: deptId,
          doctor_id: doctorId,
          reserved_at: slot,
          visit_type: visitType,
          ...(memo.trim() ? { memo: memo.trim() } : {}),
        },
      });
      key.current.reset();
      flash(`${kstTime(r.reserved_at)} 예약이 확정되었습니다.`);
      setSlot(null);
      setMemo("");
      slots.reload();
      onDone?.(r);
    } catch (e) {
      const err = toApiError(e);
      setError(err);
      // 409(이미 찬 시간)·422 는 입력을 바꿔 다시 하는 것이므로 새 키, 네트워크·5xx 는 같은 키로 재시도
      if (err.status === 409 || err.status === 422 || err.status === 403) {
        key.current.reset();
        if (err.status === 409) slots.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  if (dir.loading && !dir.departments.length) return <Loading />;
  const retryable = error && (error.status === 0 || error.status >= 500) && error.code !== "WRITE_DISABLED";

  return (
    <Card className="overflow-hidden">
      {dir.error && <div className="p-5"><ErrorNotice error={dir.error} /></div>}
      {staff && (
        <Step n={0} title="환자" done={!!patient}>
          <PatientPicker value={patient} onChange={setPatient} />
        </Step>
      )}
      <Step n={1} title="진료과" done={!!deptId}>
        <div className="flex flex-wrap gap-2">
          {bookable.map((d) => (
            <button key={d.id} type="button" className={pill(deptId === d.id)} onClick={() => { setDeptId(d.id); setDoctorId(null); setSlot(null); }}>
              {d.name}
            </button>
          ))}
        </div>
      </Step>
      <Step n={2} title="의사" done={!!doctorId}>
        {deptId ? (
          <div className="flex flex-wrap gap-2">
            {doctors.map((d) => (
              <button key={d.id} type="button" className={pill(doctorId === d.id)} onClick={() => { setDoctorId(d.id); setSlot(null); }}>
                <span className="flex items-center gap-2"><Stethoscope size={16} className="text-brand-600" />{d.name}</span>
                {d.room_no && <span className="block text-[12.5px] font-normal text-ink-400">{d.room_no}호 진료실</span>}
              </button>
            ))}
          </div>
        ) : <p className="text-[14px] text-ink-400">진료과를 먼저 고르세요.</p>}
      </Step>
      <Step n={3} title="날짜" done={!!doctorId && !!date}>
        <div className="flex flex-wrap gap-1.5">
          {days.map((d) => (
            <button key={d} type="button" onClick={() => { setDate(d); setSlot(null); }} className={cx(pill(date === d), "w-[64px] text-center")}>
              <span className={cx("block text-[12px]", weekday(d) === "일" ? "text-danger" : "text-ink-400")}>{d === today ? "오늘" : weekday(d)}</span>
              <span className="num block text-[16px]">{Number(d.slice(8))}</span>
            </button>
          ))}
          <input type="date" className={cx(inputCls, "w-[170px]")} min={today} value={date} onChange={(e) => { if (e.target.value) { setDate(e.target.value); setSlot(null); } }} aria-label="날짜 직접 선택" />
        </div>
      </Step>
      <Step n={4} title="시간 (30분 단위)" done={!!slot}>
        {!doctorId ? <p className="text-[14px] text-ink-400">의사를 먼저 고르세요.</p>
          : slots.loading ? <Loading label="빈 시간을 찾는 중" />
          : slots.error ? <ErrorNotice error={slots.error} onRetry={slots.reload} />
          : slots.data && slots.data.available.length === 0 ? <p className="text-[14px] text-ink-400">이 날은 예약할 수 있는 시간이 없습니다. 다른 날을 골라 주세요.</p>
          : (
            <div className="grid grid-cols-6 gap-2">
              {slots.data?.available.map((s) => (
                <button key={s} type="button" onClick={() => setSlot(s)} className={cx(pill(slot === s), "num text-center")}>{kstTime(s)}</button>
              ))}
            </div>
          )}
      </Step>
      <div className="grid grid-cols-[1fr_2fr] gap-4 px-6 py-5">
        <Field label="진료 구분">
          <div className="flex gap-2">
            {(["FIRST", "RETURN"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setVisitType(k)} className={cx("h-11 flex-1 rounded-xl border text-[15px] font-medium transition", visitType === k ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-ink-500 hover:bg-canvas")}>
                {k === "FIRST" ? "초진" : "재진"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="메모 (선택)">
          <input className={inputCls} value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={500} placeholder="증상이나 전달할 내용" />
        </Field>
      </div>
      {error && <div className="px-6 pb-2"><ErrorNotice error={error} /></div>}
      <div className="flex items-center justify-between border-t border-line bg-canvas/50 px-6 py-4">
        <p className="text-[13.5px] text-ink-500">
          {slot ? <><CalendarCheck size={15} className="mr-1 inline text-brand-600" />{date} {kstTime(slot)} · {dir.deptName(deptId)} {dir.doctorName(doctorId)}</> : "시간까지 고르면 예약할 수 있습니다."}
        </p>
        <Btn variant="primary" className="h-11 px-5 text-[15px]" onClick={submit} disabled={busy || !slot || (staff && !patient)}>
          {retryable ? <><RefreshCw size={17} /> 다시 보내기</> : <><Check size={17} /> 예약하기</>}
        </Btn>
      </div>
    </Card>
  );
}
