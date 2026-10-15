/**
 * 의사 화면: 내 진료 대기열 (GET /doctor/queue) + 진료 시작(R15)·진료 완료(R16).
 * 진료 상태는 진료대기 → 진료중 → 진료완료 순서로만 바뀐다. 담당 의사가 아니면 서버가 403 으로 거부한다 (버튼 표시와 무관).
 */
import { CircleCheck, Clock, DoorOpen, Play, RefreshCw, Stethoscope } from "lucide-react";
import { useState } from "react";
import { api, toApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { kstTime, todayKst } from "../lib/time";
import type { QueueItem, QueueOut, Reservation } from "../lib/types";
import { useApi } from "../lib/useApi";
import { Btn, Card, cx, ErrorNotice, Kpi, Loading, ProgressChip } from "../ui/kit";
import { useDirectory } from "./directory";

type Step = "start-treatment" | "complete-treatment";

export default function DoctorDesk() {
  const { flash } = useAppState();
  const dir = useDirectory();
  const today = todayKst();
  const queue = useApi(() => api<QueueOut>("/doctor/queue", { query: { date: today } }), [today]);
  const [busy, setBusy] = useState<number | null>(null);

  const items = queue.data?.items ?? [];
  const count = (s: QueueItem["checkin_status"]) => items.filter((i) => i.checkin_status === s).length;

  const act = async (q: QueueItem, step: Step) => {
    setBusy(q.reservation_id);
    try {
      await api<Reservation>(`/reservations/${q.reservation_id}/${step}`, { method: "POST" });
      flash(`${q.patient_name} 님 ${step === "start-treatment" ? "진료를 시작했습니다" : "진료를 완료했습니다"}`);
      queue.reload();
    } catch (e) {
      flash(toApiError(e).message, "danger");
      queue.reload();
    } finally {
      setBusy(null);
    }
  };

  if (queue.error && !queue.data) return <ErrorNotice error={queue.error} onRetry={queue.reload} />;
  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[24px] font-bold tracking-tight">내 진료 대기열</p>
          <p className="mt-1 text-[15px] text-ink-500">오늘 진료대기 {count("CHECKED_IN")}명, 진료중 {count("IN_TREATMENT")}명입니다.</p>
        </div>
        <Btn onClick={queue.reload}><RefreshCw size={16} /> 새로고침</Btn>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Kpi label="진료 대기" value={count("CHECKED_IN")} unit="명" sub="접수 완료 · 대기번호 순" icon={<Clock size={19} />} tone="bg-amber-50 text-warn" />
        <Kpi label="진료중" value={count("IN_TREATMENT")} unit="명" icon={<Stethoscope size={19} />} tone="bg-brand-50 text-brand-600" />
        <Kpi label="진료 완료" value={count("COMPLETED")} unit="명" icon={<CircleCheck size={19} />} tone="bg-emerald-50 text-ok" />
      </div>

      <Card className="mt-4 overflow-hidden">
        {queue.loading && !queue.data ? <Loading /> : !items.length ? (
          <div className="grid min-h-[200px] place-items-center text-[14px] text-ink-400">오늘 접수된 환자가 없습니다.</div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((q) => (
              <li key={q.reservation_id} className={cx("flex items-center gap-4 px-5 py-4", q.checkin_status === "COMPLETED" && "text-ink-400")}>
                <span className="num grid h-9 min-w-9 place-items-center rounded-lg bg-canvas px-1.5 font-mono text-[15px] font-semibold text-ink-700">{q.queue_no}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15.5px] font-semibold">{q.patient_name} <span className="font-mono text-[12.5px] font-normal text-ink-400">{q.chart_no}</span></p>
                  <p className="num mt-0.5 flex items-center gap-2 text-[12.5px] text-ink-400">
                    <span>예약 {kstTime(q.reserved_at)}</span><span>접수 {kstTime(q.checked_in_at)}</span>
                    {q.doctor_id && <span className="flex items-center gap-1"><DoorOpen size={13} />{dir.doctors.find((d) => d.id === q.doctor_id)?.room_no ?? "—"}호</span>}
                  </p>
                </div>
                <ProgressChip status={q.checkin_status} />
                <div className="flex w-[120px] justify-end">
                  {q.checkin_status === "CHECKED_IN" && (
                    <Btn variant="primary" disabled={busy === q.reservation_id} onClick={() => act(q, "start-treatment")}><Play size={15} /> 진료 시작</Btn>
                  )}
                  {q.checkin_status === "IN_TREATMENT" && (
                    <Btn variant="primary" disabled={busy === q.reservation_id} onClick={() => act(q, "complete-treatment")}><CircleCheck size={15} /> 진료 완료</Btn>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
