/** 환자 검색(R9)·상세(R10)·등록(R14). 피그마 환자 관리 화면 배치 (왼쪽 목록, 오른쪽 상세). */
import { Check, FileText, Plus, UserRound } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { api, toApiError, type ApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { kstDate, kstShort } from "../lib/time";
import type { Patient, PatientDetail, PatientSummary } from "../lib/types";
import { useApi } from "../lib/useApi";
import {
  Avatar, Btn, Card, cx, Empty, ErrorNotice, Field, inputCls, Loading, Modal, ReservationChip, SearchBox,
} from "../ui/kit";
import { useDirectory } from "./directory";

function RegisterModal({ onClose, onDone }: { onClose: () => void; onDone: (p: Patient) => void }) {
  const { flash } = useAppState();
  const [form, setForm] = useState({ chart_no: "", name: "", birth_date: "", phone: "" });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const p = await api<Patient>("/patients", {
        method: "POST",
        body: { chart_no: form.chart_no.trim(), name: form.name.trim(), birth_date: form.birth_date, ...(form.phone.trim() ? { phone: form.phone.trim() } : {}) },
      });
      flash(`${p.name} 님을 등록했습니다.`);
      onDone(p);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} title="환자 등록">
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <Field label="차트번호" hint="영문·숫자·- 최대 20자"><input className={inputCls} value={form.chart_no} onChange={set("chart_no")} maxLength={20} pattern="[A-Za-z0-9-]+" required /></Field>
          <Field label="이름"><input className={inputCls} value={form.name} onChange={set("name")} maxLength={50} required /></Field>
          <Field label="생년월일"><input className={inputCls} type="date" value={form.birth_date} onChange={set("birth_date")} min="1900-01-01" required /></Field>
          <Field label="연락처 (선택)"><input className={inputCls} value={form.phone} onChange={set("phone")} maxLength={20} pattern="[0-9-]+" placeholder="010-0000-0000" /></Field>
        </div>
        {error && <div className="px-6 pb-3"><ErrorNotice error={error} /></div>}
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <Btn onClick={onClose}>닫기</Btn>
          <Btn type="submit" variant="primary" disabled={busy}><Check size={17} /> 등록</Btn>
        </div>
      </form>
    </Modal>
  );
}

/** 환자 검색(R9·R10) 권한이 없는 역할(ADMIN)은 등록(R14)만 쓴다. */
function RegisterOnly() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<Patient | null>(null);
  return (
    <Card className="grid h-[320px] place-items-center text-center">
      <div>
        <UserRound size={32} className="mx-auto mb-2 text-ink-400" />
        <p className="mb-4 text-[15px] text-ink-500">이 계정은 환자를 등록할 수 있습니다. 검색·상세 조회 권한은 없습니다.</p>
        <Btn variant="primary" onClick={() => setOpen(true)}><Plus size={17} /> 환자 등록</Btn>
        {last && <p className="mt-4 text-[13px] text-ink-500">방금 등록: {last.name} ({last.chart_no})</p>}
      </div>
      {open && <RegisterModal onClose={() => setOpen(false)} onDone={(p) => { setOpen(false); setLast(p); }} />}
    </Card>
  );
}

export default function Patients({ canRegister = false, canSearch = true }: { canRegister?: boolean; canSearch?: boolean }) {
  if (!canSearch) return canRegister ? <RegisterOnly /> : null;
  return <PatientSearch canRegister={canRegister} />;
}

function PatientSearch({ canRegister }: { canRegister: boolean }) {
  const dir = useDirectory();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [register, setRegister] = useState(false);
  const list = useApi(term ? () => api<{ items: PatientSummary[]; total: number }>("/patients", { query: { q: term, size: 50 } }) : null, [term]);
  const detail = useApi(sel ? () => api<PatientDetail>(`/patients/${sel}`) : null, [sel]);

  return (
    <div className="grid grid-cols-[360px_1fr] gap-5">
      <Card className="flex h-[calc(100vh-148px)] flex-col overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex gap-2">
            <SearchBox value={q} onChange={setQ} onEnter={() => setTerm(q.trim())} placeholder="이름 · 차트번호" className="flex-1" />
            <Btn onClick={() => setTerm(q.trim())} disabled={!q.trim()}>찾기</Btn>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ink-500">{term ? <>찾은 환자 <b className="num text-ink-900">{list.data?.total ?? 0}</b>명</> : "이름 일부나 차트번호 앞부분으로 찾습니다."}</p>
            {canRegister && <Btn variant="soft" className="h-9 px-3 text-[13px]" onClick={() => setRegister(true)}><Plus size={15} /> 환자 등록</Btn>}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {list.loading && <Loading />}
          {list.error && <li className="p-2"><ErrorNotice error={list.error} /></li>}
          {list.data?.items.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => setSel(x.id)} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition", x.id === sel ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-canvas")}>
                <Avatar name={x.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{x.name} <span className="ml-1 text-[13px] font-normal text-ink-400">{x.birth_date}</span></p>
                  <p className="num font-mono text-[12.5px] text-ink-400">{x.chart_no}</p>
                </div>
                <span className="num text-[12px] text-ink-400">{x.phone ?? ""}</span>
              </button>
            </li>
          ))}
          {list.data && list.data.items.length === 0 && <p className="py-12 text-center text-[14px] text-ink-400">검색 결과가 없습니다.</p>}
        </ul>
      </Card>

      <div>
        {!sel ? (
          <Card className="grid h-[320px] place-items-center text-center text-ink-400">
            <div><UserRound size={32} className="mx-auto mb-2" /><p className="text-[15px]">왼쪽에서 환자를 찾아 고르세요.</p></div>
          </Card>
        ) : detail.loading && !detail.data ? <Loading /> : detail.error ? <ErrorNotice error={detail.error} onRetry={detail.reload} /> : detail.data && (
          <Card className="p-6">
            <div className="flex items-start gap-5">
              <Avatar name={detail.data.name} size={72} />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-[26px] font-bold tracking-tight">{detail.data.name}</h2>
                  <span className="text-[15px] text-ink-500">{detail.data.birth_date}</span>
                </div>
                <p className="num mt-1 font-mono text-[14px] text-ink-500">차트번호 {detail.data.chart_no}</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-x-10 gap-y-5">
              {[["이름", detail.data.name], ["생년월일", detail.data.birth_date], ["연락처", detail.data.phone ?? "—"], ["등록일", kstDate(detail.data.created_at)]].map(([k, v]) => (
                <div key={k} className="border-b border-line/70 pb-3">
                  <dt className="text-[13px] text-ink-400">{k}</dt>
                  <dd className="mt-1 text-[16px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <h4 className="mt-7 mb-3 flex items-center gap-2 text-[15px] font-semibold"><FileText size={17} className="text-brand-600" />최근 예약 <span className="num text-ink-400">{detail.data.recent_reservations.length}</span></h4>
            {detail.data.recent_reservations.length ? (
              <ul className="space-y-2">
                {detail.data.recent_reservations.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                    <span className="num w-[110px] text-[14px] font-semibold">{kstShort(r.reserved_at)}</span>
                    <span className="flex-1 text-[14px]">{dir.deptName(r.department_id)} <span className="text-[12.5px] text-ink-400">· {dir.doctorName(r.doctor_id)}</span></span>
                    <ReservationChip r={r} />
                  </li>
                ))}
              </ul>
            ) : <Empty>볼 수 있는 예약이 없습니다.</Empty>}
            <p className="mt-3 text-[12.5px] text-ink-400">간호사는 자기 부서 예약만, 원무과장은 전체 부서 예약이 보입니다(예약 메모는 보이지 않습니다). 이 조회는 감사 로그에 남습니다.</p>
          </Card>
        )}
      </div>

      {register && <RegisterModal onClose={() => setRegister(false)} onDone={(p) => { setRegister(false); setQ(p.chart_no); setTerm(p.chart_no); setSel(p.id); }} />}
    </div>
  );
}
