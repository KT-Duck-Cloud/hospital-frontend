/** 환자 화면: 내 예약(R2 본인 범위, R4 취소), 내 진료기록(R11)·영수증(R12) */
import { Ban, CalendarClock, FileText, Receipt as ReceiptIcon } from "lucide-react";
import { useState } from "react";
import { api, toApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { kstDate, kstFull, kstShort } from "../lib/time";
import type { MedicalRecord, Page, Receipt, Reservation } from "../lib/types";
import { useApi } from "../lib/useApi";
import {
  Btn, Card, CardHead, cx, Empty, ErrorNotice, Loading, Modal, ReservationChip, tableHeadRow, tableRow, Th,
} from "../ui/kit";
import { useDirectory } from "./directory";

export function MyReservations() {
  const { flash } = useAppState();
  const dir = useDirectory();
  const list = useApi(() => api<Page<Reservation>>("/reservations", { query: { size: 100 } }), []);
  const [confirm, setConfirm] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);
  const now = Date.now();

  const cancel = async (r: Reservation) => {
    setBusy(true);
    try {
      await api(`/reservations/${r.id}`, { method: "DELETE" });
      flash("예약을 취소했습니다.");
      list.reload();
    } catch (e) {
      flash(toApiError(e).message, "danger");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (list.loading && !list.data) return <Loading />;
  if (list.error) return <ErrorNotice error={list.error} onRetry={list.reload} />;
  const items = list.data?.items ?? [];
  const upcoming = items.filter((r) => r.status === "BOOKED" && new Date(r.reserved_at).getTime() >= now);
  const past = items.filter((r) => !upcoming.includes(r)).reverse();

  const table = (rows: Reservation[], canCancel: boolean) => (
    <table className="w-full text-left text-[14.5px]">
      <thead><tr className={tableHeadRow}><Th>날짜·시간</Th><Th>진료과 / 의사</Th><Th>구분</Th><Th>상태</Th><Th>메모</Th><Th /></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className={cx(tableRow, r.status === "CANCELED" && "text-ink-400")}>
            <td className="num px-5 py-3.5 font-semibold">{kstShort(r.reserved_at)}</td>
            <td className="px-5 py-3.5">{dir.deptName(r.department_id)} <span className="text-ink-400">· {dir.doctorName(r.doctor_id)}</span></td>
            <td className="px-5 py-3.5 text-[13px] text-ink-500">{r.visit_type === "FIRST" ? "초진" : "재진"}</td>
            <td className="px-5 py-3.5"><ReservationChip r={r} /></td>
            <td className="max-w-[220px] truncate px-5 py-3.5 text-[13px] text-ink-500">{r.memo ?? "—"}</td>
            <td className="px-5 py-3.5 text-right">
              {canCancel && r.checkin_status === "NOT_CHECKED_IN" && (
                <button type="button" onClick={() => setConfirm(r)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-3 text-[13px] font-medium text-danger hover:bg-red-50">
                  <Ban size={14} />취소
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHead title="다가오는 예약" icon={<CalendarClock size={18} />} sub={`${upcoming.length}건`} />
        {upcoming.length ? table(upcoming, true) : <Empty>다가오는 예약이 없습니다.</Empty>}
      </Card>
      <Card className="overflow-hidden">
        <CardHead title="지난 예약 · 취소" sub={`${past.length}건`} />
        {past.length ? table(past, false) : <Empty>지난 예약이 없습니다.</Empty>}
      </Card>
      {confirm && (
        <Modal onClose={() => setConfirm(null)} width={420}>
          <div className="p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-danger"><Ban size={22} /></span>
            <h3 className="mt-4 text-[18px] font-bold">예약을 취소할까요?</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-500">
              {kstShort(confirm.reserved_at)} · {dir.deptName(confirm.department_id)} {dir.doctorName(confirm.doctor_id)}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Btn onClick={() => setConfirm(null)}>돌아가기</Btn>
              <Btn variant="danger" disabled={busy} onClick={() => cancel(confirm)}>예약 취소</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const PAY: Record<Receipt["pay_status"], { label: string; cls: string }> = {
  PAID: { label: "결제 완료", cls: "bg-emerald-50 text-ok ring-emerald-200" },
  UNPAID: { label: "미결제", cls: "bg-amber-50 text-warn ring-amber-200" },
  REFUNDED: { label: "환불", cls: "bg-canvas text-ink-500 ring-line" },
};

export function MyRecords() {
  const records = useApi(() => api<MedicalRecord[]>("/me/records"), []);
  const receipts = useApi(() => api<Receipt[]>("/me/receipts"), []);

  return (
    <div className="grid grid-cols-[1.2fr_1fr] gap-4">
      <Card>
        <CardHead title="내 진료기록" icon={<FileText size={18} />} />
        <div className="px-6 pb-6">
          {records.loading ? <Loading /> : records.error ? (
            records.error.code === "RECORD_UNAVAILABLE"
              ? <p className="rounded-xl bg-canvas px-4 py-6 text-center text-[14px] text-ink-500">지금은 진료기록을 볼 수 없습니다. 잠시 후 다시 확인해 주세요.</p>
              : <ErrorNotice error={records.error} onRetry={records.reload} />
          ) : records.data && records.data.length ? (
            <ol className="relative space-y-5 border-l-2 border-brand-100 pl-5">
              {records.data.map((r) => (
                <li key={r.id} className="relative">
                  <span className="absolute top-1.5 -left-[27px] h-3 w-3 rounded-full bg-brand-500" />
                  <p className="num text-[13.5px] font-semibold">{kstDate(r.created_at).replaceAll("-", ".")} <span className="ml-1 font-normal text-ink-400">{r.doctor_name ?? "담당의"}</span></p>
                  <p className="mt-0.5 text-[15.5px] font-semibold">{r.diagnosis}</p>
                  <p className="text-[14px] leading-relaxed text-ink-700">{r.note}</p>
                </li>
              ))}
            </ol>
          ) : <Empty>진료기록이 없습니다.</Empty>}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <CardHead title="내 영수증" icon={<ReceiptIcon size={18} />} />
        {receipts.loading ? <Loading /> : receipts.error ? <div className="p-5"><ErrorNotice error={receipts.error} onRetry={receipts.reload} /></div>
          : receipts.data && receipts.data.length ? (
            <table className="w-full text-left text-[14.5px]">
              <thead><tr className={tableHeadRow}><Th>날짜</Th><Th className="text-right">금액</Th><Th>상태</Th></tr></thead>
              <tbody>
                {receipts.data.map((r) => (
                  <tr key={r.id} className={tableRow}>
                    <td className="num px-5 py-3.5">{kstFull(r.paid_at ?? r.created_at)}</td>
                    <td className="num px-5 py-3.5 text-right font-semibold">{r.amount.toLocaleString("ko-KR")}원</td>
                    <td className="px-5 py-3.5"><span className={cx("inline-flex rounded-full px-2.5 py-0.5 text-[12.5px] font-medium ring-1 ring-inset", PAY[r.pay_status].cls)}>{PAY[r.pay_status].label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty>영수증이 없습니다.</Empty>}
      </Card>
    </div>
  );
}
