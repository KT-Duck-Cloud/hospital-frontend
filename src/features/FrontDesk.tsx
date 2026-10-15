/**
 * 간호사 화면 (피그마 그대로): 오늘 대기열 · 현장 접수.
 * - 오늘 대기열: 접수 대기(오늘 예약, 아직 접수 전) ↔ 진료 대기(R8 접수 순·대기번호)
 * - 현장 접수: 날짜별 예약 표(R2) + 접수(R5)·취소(R4) + 새 예약(R1)
 * 범위(자기 부서)는 서버가 정한다. 화면은 받은 것만 보여 준다.
 */
import { ArrowRight, Ban, CalendarCheck, ChevronLeft, ChevronRight, CircleCheck, ClipboardList, Clock, DoorOpen, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { api, toApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { addDays, dateLabel, kstTime, todayKst } from "../lib/time";
import type { Page, QueueOut, Reservation } from "../lib/types";
import { useApi } from "../lib/useApi";
import {
  Avatar, Btn, Card, Chip, cx, Empty, ErrorNotice, Kpi, Loading, Modal, ProgressChip, ReservationChip, SearchBox, tableHeadRow,
  tableRow, Th,
} from "../ui/kit";
import Booking from "./Booking";
import { useDirectory } from "./directory";

const dayReservations = (date: string) =>
  api<Page<Reservation>>("/reservations", { query: { date_from: date, date_to: date, size: 100 } });

function useCheckin(onDone: () => void) {
  const { flash } = useAppState();
  const [busy, setBusy] = useState<number | null>(null);
  const checkin = async (r: Reservation) => {
    setBusy(r.id);
    try {
      const out = await api<Reservation>(`/reservations/${r.id}/checkin`, { method: "POST" });
      flash(`${r.patient_name ?? "환자"} 님 접수 완료 · 대기번호 ${out.queue_no}번`);
      onDone();
    } catch (e) {
      flash(toApiError(e).message, "danger");
    } finally {
      setBusy(null);
    }
  };
  return { checkin, busy };
}

/* ───────────── 오늘 대기열 ───────────── */
export function TodayQueue() {
  const today = todayKst();
  const dir = useDirectory();
  const list = useApi(() => dayReservations(today), [today]);
  const queue = useApi(() => api<QueueOut>("/queue", { query: { date: today } }), [today]);
  const reload = () => { list.reload(); queue.reload(); };
  const { checkin, busy } = useCheckin(reload);

  const items = list.data?.items ?? [];
  const waitingCheckin = items.filter((r) => r.status === "BOOKED" && r.checkin_status === "NOT_CHECKED_IN");
  const canceled = items.filter((r) => r.status === "CANCELED").length;
  const inLine = (queue.data?.items ?? []).filter((q) => q.checkin_status === "CHECKED_IN").length;  // 진료대기만
  const forbidden = list.error?.forbidden && queue.error?.forbidden;

  if (forbidden) return <ErrorNotice error={list.error!} />;
  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[24px] font-bold tracking-tight">오늘 대기열</p>
          <p className="mt-1 text-[15px] text-ink-500">지금 진료 대기 {inLine}명, 접수 대기 {waitingCheckin.length}명입니다.</p>
        </div>
        <Btn onClick={reload}><RefreshCw size={16} /> 새로고침</Btn>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Kpi label="오늘 예약" value={items.length - canceled} unit="건" sub={`전체 ${list.data?.total ?? 0}건 중 취소 ${canceled}건 제외`} icon={<CalendarCheck size={19} />} tone="bg-brand-50 text-brand-600" />
        <Kpi label="접수 대기" value={waitingCheckin.length} unit="명" sub="예약했지만 아직 접수 전" icon={<ClipboardList size={19} />} tone="bg-slate-100 text-slate-600" />
        <Kpi label="진료 대기" value={inLine} unit="명" sub="접수 완료 · 아직 진료 전" icon={<Clock size={19} />} tone="bg-amber-50 text-warn" />
        <Kpi label="취소" value={canceled} unit="건" sub="오늘 예약 중 취소" icon={<Ban size={19} />} tone="bg-red-50 text-danger" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* 접수 대기 */}
        <section className="flex min-h-[460px] flex-col rounded-2xl border border-line bg-white/60">
          <header className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><ClipboardList size={17} /></span>
              <h3 className="text-[16px] font-semibold">접수 대기</h3>
            </div>
            <span className="num grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-[13.5px] font-semibold ring-1 ring-line">{waitingCheckin.length}</span>
          </header>
          <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
            {list.loading && !list.data ? <Loading /> : list.error ? <ErrorNotice error={list.error} onRetry={list.reload} /> : waitingCheckin.map((r) => (
              <article key={r.id} className="rounded-xl border border-line bg-white p-3.5 transition hover:border-brand-200">
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.patient_name ?? "?"} size={30} />
                  <p className="min-w-0 flex-1 truncate text-[15.5px] font-semibold">{r.patient_name ?? `환자 #${r.patient_id}`} <span className="font-mono text-[12.5px] font-normal text-ink-400">{r.chart_no}</span></p>
                  <span className="num text-[13px] font-semibold text-brand-700">{kstTime(r.reserved_at)}</span>
                </div>
                <p className="mt-2 text-[13px] text-ink-500">{dir.deptName(r.department_id)} · {dir.doctorName(r.doctor_id)} · {r.visit_type === "FIRST" ? "초진" : "재진"}</p>
                {r.memo && <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12.5px] text-warn">{r.memo}</p>}
                <button type="button" disabled={busy === r.id} onClick={() => checkin(r)} className="mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-lg bg-brand-50 text-[13.5px] font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-40">
                  접수 완료 <ArrowRight size={15} />
                </button>
              </article>
            ))}
            {list.data && !waitingCheckin.length && <div className="grid flex-1 place-items-center text-[13.5px] text-ink-400">접수 대기 환자가 없습니다.</div>}
          </div>
        </section>

        {/* 진료 대기 (R8) */}
        <section className="flex min-h-[460px] flex-col rounded-2xl border border-line bg-white/60">
          <header className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-warn"><Clock size={17} /></span>
              <h3 className="text-[16px] font-semibold">진료 현황</h3>
              <span className="text-[13px] text-ink-400">접수 순</span>
            </div>
            <span className="num grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-[13.5px] font-semibold ring-1 ring-line">{queue.data?.items.length ?? 0}</span>
          </header>
          <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
            {queue.loading && !queue.data ? <Loading /> : queue.error ? <ErrorNotice error={queue.error} onRetry={queue.reload} /> : queue.data?.items.map((q) => (
              <article key={q.reservation_id} className="rounded-xl border border-line bg-white p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="num grid h-8 min-w-8 place-items-center rounded-lg bg-canvas px-1.5 font-mono text-[14px] font-semibold text-ink-700">{q.queue_no}</span>
                  <p className="min-w-0 flex-1 truncate text-[15.5px] font-semibold">{q.patient_name} <span className="font-mono text-[12.5px] font-normal text-ink-400">{q.chart_no}</span></p>
                  <ProgressChip status={q.checkin_status} />
                </div>
                <p className="mt-2 text-[13px] text-ink-500">{dir.deptName(q.department_id)} · {q.doctor_name ?? "의사 미지정"}</p>
                {q.doctor_id && <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-400"><DoorOpen size={13} />{dir.doctors.find((d) => d.id === q.doctor_id)?.room_no ?? "—"}호 진료실</p>}
                <div className="num mt-2 flex items-center justify-between border-t border-line/70 pt-2 text-[12.5px] text-ink-400">
                  <span>예약 {kstTime(q.reserved_at)}</span><span>접수 {kstTime(q.checked_in_at)}</span>
                </div>
              </article>
            ))}
            {queue.data && !queue.data.items.length && <div className="grid flex-1 place-items-center text-[13.5px] text-ink-400">진료 대기 환자가 없습니다.</div>}
          </div>
        </section>
      </div>
    </>
  );
}

/* ───────────── 현장 접수 ───────────── */
export function CheckinDesk({ canBook = true }: { canBook?: boolean } = {}) {
  const { flash } = useAppState();
  const dir = useDirectory();
  const [date, setDate] = useState(todayKst());
  const [q, setQ] = useState("");
  const [booking, setBooking] = useState(false);
  const [confirm, setConfirm] = useState<Reservation | null>(null);
  const list = useApi(() => dayReservations(date), [date]);
  const { checkin, busy } = useCheckin(list.reload);

  const rows = (list.data?.items ?? []).filter((r) => !q || (r.patient_name ?? "").includes(q) || (r.chart_no ?? "").toLowerCase().includes(q.toLowerCase()));
  const count = (pred: (r: Reservation) => boolean) => (list.data?.items ?? []).filter(pred).length;

  const cancel = async (r: Reservation) => {
    try {
      await api(`/reservations/${r.id}`, { method: "DELETE" });
      flash("예약을 취소했습니다.");
      list.reload();
    } catch (e) {
      flash(toApiError(e).message, "danger");
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDate(addDays(date, -1))} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white hover:bg-canvas" aria-label="이전 날"><ChevronLeft size={20} /></button>
          <div className="flex h-11 min-w-[230px] items-center justify-center rounded-xl border border-line bg-white px-4 text-[16px] font-semibold">{dateLabel(date)}</div>
          <button type="button" onClick={() => setDate(addDays(date, 1))} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white hover:bg-canvas" aria-label="다음 날"><ChevronRight size={20} /></button>
          <Btn onClick={() => setDate(todayKst())} variant="soft" className="h-11">오늘</Btn>
        </div>
        {canBook && <Btn variant="primary" className="h-11 px-5 text-[15px]" onClick={() => setBooking(true)}><Plus size={18} /> 예약 등록</Btn>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="환자명 또는 차트번호" className="w-[300px]" />
        <div className="ml-auto flex items-center gap-2 text-[13.5px] text-ink-500">
          <Chip className="bg-brand-50 text-brand-700 ring-brand-200">예약확정 <b className="num">{count((r) => r.status === "BOOKED" && r.checkin_status === "NOT_CHECKED_IN")}</b></Chip>
          <Chip className="bg-emerald-50 text-ok ring-emerald-200">접수완료 <b className="num">{count((r) => r.status === "BOOKED" && r.checkin_status !== "NOT_CHECKED_IN")}</b></Chip>
          <Chip className="bg-red-50 text-danger ring-red-200">취소됨 <b className="num">{count((r) => r.status === "CANCELED")}</b></Chip>
        </div>
      </div>

      {list.error ? <ErrorNotice error={list.error} onRetry={list.reload} /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-[14.5px]">
            <thead><tr className={tableHeadRow}><Th>시간</Th><Th>환자</Th><Th>차트번호</Th><Th>진료과 / 의사</Th><Th>구분</Th><Th>상태</Th><Th>대기번호</Th><Th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const canceled = r.status === "CANCELED";
                const open = !canceled && r.checkin_status === "NOT_CHECKED_IN";
                return (
                  <tr key={r.id} className={cx(tableRow, canceled && "text-ink-400")}>
                    <td className="num px-5 py-3.5 font-semibold">{kstTime(r.reserved_at)}</td>
                    <td className="px-5 py-3.5"><span className="flex items-center gap-2.5"><Avatar name={r.patient_name ?? "?"} size={30} /><b className={cx("font-semibold", canceled && "line-through")}>{r.patient_name ?? `#${r.patient_id}`}</b></span></td>
                    <td className="num px-5 py-3.5 font-mono text-[13px] text-ink-500">{r.chart_no ?? "—"}</td>
                    <td className="px-5 py-3.5">{dir.deptName(r.department_id)} <span className="text-ink-400">· {dir.doctorName(r.doctor_id)}</span></td>
                    <td className="px-5 py-3.5"><span className={cx("text-[13px]", r.visit_type === "FIRST" ? "font-semibold text-brand-700" : "text-ink-500")}>{r.visit_type === "FIRST" ? "초진" : "재진"}</span></td>
                    <td className="px-5 py-3.5"><ReservationChip r={r} /></td>
                    <td className="num px-5 py-3.5 text-ink-700">{r.queue_no ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" disabled={!open || busy === r.id} onClick={() => checkin(r)} className="flex h-9 items-center gap-1 rounded-lg bg-brand-50 px-3 text-[13px] font-medium text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-35"><CircleCheck size={14} />접수</button>
                        <button type="button" disabled={!open} onClick={() => setConfirm(r)} className="flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-[13px] font-medium text-danger hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35"><Ban size={14} />취소</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.loading && !list.data && <Loading />}
          {list.data && rows.length === 0 && <Empty>조건에 맞는 예약이 없습니다.</Empty>}
          <div className="flex items-center justify-between border-t border-line bg-canvas/50 px-5 py-3 text-[13px] text-ink-500">
            <span>총 <b className="num text-ink-900">{rows.length}</b>건 표시{list.data && list.data.total > list.data.items.length ? ` (전체 ${list.data.total}건 중 앞 ${list.data.items.length}건)` : ""}</span>
            <span>접수하면 진료과별 대기번호가 붙습니다.</span>
          </div>
        </Card>
      )}

      {booking && (
        <Modal onClose={() => setBooking(false)} width={860} title="예약 등록">
          <div className="p-5">
            <Booking staff defaultDate={date} onDone={() => { setBooking(false); list.reload(); }} />
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal onClose={() => setConfirm(null)} width={420}>
          <div className="p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-danger"><Ban size={22} /></span>
            <h3 className="mt-4 text-[18px] font-bold">예약을 취소할까요?</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-500">{confirm.patient_name} 님 · {kstTime(confirm.reserved_at)} · {dir.deptName(confirm.department_id)} {dir.doctorName(confirm.doctor_id)}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Btn onClick={() => setConfirm(null)}>돌아가기</Btn>
              <Btn variant="danger" onClick={() => cancel(confirm)}>예약 취소</Btn>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
