/** 계정(A3·A4·A5)·감사 로그(A6). 비밀번호는 화면 코드에 넣지 않고, 만들 때 관리자가 입력한 값만 보낸다. */
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, ScrollText } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, toApiError, type ApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { ROLE_LABEL, ROLES } from "../lib/roles";
import { addDays, kstFull, todayKst } from "../lib/time";
import type { AdminUser, AuditLog, Page, Role } from "../lib/types";
import { useApi } from "../lib/useApi";
import {
  Btn, Card, CardHead, Chip, cx, Empty, ErrorNotice, Field, inputCls, Loading, Modal, SearchBox, Segmented, tableHeadRow, tableRow, Th,
} from "../ui/kit";
import { useDirectory } from "./directory";

const STAFF: Role[] = ROLES.filter((r) => r !== "PATIENT");

function UserModal({ user, onClose, onDone }: { user?: AdminUser; onClose: () => void; onDone: () => void }) {
  const { flash } = useAppState();
  const dir = useDirectory();
  const [form, setForm] = useState({
    login_id: "", name: "", password: "",
    role: (user?.role ?? "NURSE") as Role,
    department_id: user?.department_id ? String(user.department_id) : "",
    patient_id: "",
    is_active: user?.is_active ?? true,
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const department_id = form.department_id ? Number(form.department_id) : null;
    try {
      if (user) {
        const out = await api<AdminUser & { revoked_sessions: number }>(`/admin/users/${user.id}`, {
          method: "PATCH", body: { role: form.role, department_id, is_active: form.is_active },
        });
        flash(out.revoked_sessions ? `변경했습니다. 로그인 세션 ${out.revoked_sessions}개를 끊었습니다.` : "변경했습니다.");
      } else {
        await api<AdminUser>("/admin/users", {
          method: "POST",
          body: {
            login_id: form.login_id.trim(), name: form.name.trim(), role: form.role, department_id,
            ...(form.role === "PATIENT" && form.patient_id ? { patient_id: Number(form.patient_id) } : {}),
            password: form.password,
          },
        });
        flash("계정을 만들었습니다.");
      }
      setForm((f) => ({ ...f, password: "" }));
      onDone();
    } catch (err) {
      setForm((f) => ({ ...f, password: "" }));
      setError(toApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} title={user ? `${user.name} (${user.login_id}) 변경` : "계정 만들기"}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          {!user && (
            <>
              <Field label="아이디" hint="영문·숫자·_ . - 3~50자"><input className={inputCls} value={form.login_id} onChange={(e) => setForm({ ...form, login_id: e.target.value })} pattern="[A-Za-z0-9_.\-]{3,50}" required autoComplete="off" /></Field>
              <Field label="이름"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={50} required /></Field>
              <Field label="처음 비밀번호" hint="10자 이상. 본인에게 따로 전달하세요"><input className={inputCls} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={10} maxLength={72} required autoComplete="new-password" /></Field>
            </>
          )}
          <Field label="역할">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          <Field label="부서" hint="간호사·의사·원무과장·부서장은 필수">
            <select className={inputCls} value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="">없음</option>
              {dir.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          {!user && form.role === "PATIENT" && (
            <Field label="환자 번호 (patient_id)"><input className={inputCls} inputMode="numeric" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value.replace(/\D/g, "") })} required /></Field>
          )}
          {user && (
            <Field label="상태">
              <Segmented value={form.is_active ? "on" : "off"} onChange={(v) => setForm({ ...form, is_active: v === "on" })} options={[{ value: "on", label: "사용" }, { value: "off", label: "사용 중지" }]} />
            </Field>
          )}
        </div>
        {user && <p className="px-6 text-[13px] text-ink-500">역할·부서·상태가 바뀌면 그 사용자는 다시 로그인해야 합니다.</p>}
        {error && <div className="px-6 pt-3"><ErrorNotice error={error} /></div>}
        <div className="mt-4 flex justify-end gap-2 border-t border-line px-6 py-4">
          <Btn onClick={onClose}>닫기</Btn>
          <Btn type="submit" variant="primary" disabled={busy}><Check size={17} /> {user ? "변경 저장" : "만들기"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

export function AdminUsers() {
  const dir = useDirectory();
  const [role, setRole] = useState<"ALL" | Role>("ALL");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ user?: AdminUser } | null>(null);
  const list = useApi(
    () => api<Page<AdminUser>>("/admin/users", { query: { role: role === "ALL" ? undefined : role, q: term || undefined, page, size: 20 } }),
    [role, term, page],
  );
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.size)) : 1;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchBox value={q} onChange={setQ} onEnter={() => { setTerm(q.trim()); setPage(1); }} placeholder="아이디 또는 이름" className="w-[260px]" />
        <select className={cx(inputCls, "w-[170px]")} value={role} onChange={(e) => { setRole(e.target.value as "ALL" | Role); setPage(1); }}>
          <option value="ALL">역할 전체</option>
          {STAFF.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <Btn variant="primary" className="ml-auto h-11" onClick={() => setModal({})}><Plus size={18} /> 계정 만들기</Btn>
      </div>
      {list.error ? <ErrorNotice error={list.error} onRetry={list.reload} /> : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-[14.5px]">
            <thead><tr className={tableHeadRow}><Th>아이디</Th><Th>이름</Th><Th>역할</Th><Th>부서</Th><Th>상태</Th><Th>최근 로그인</Th><Th /></tr></thead>
            <tbody>
              {list.data?.items.map((u) => (
                <tr key={u.id} className={cx(tableRow, !u.is_active && "text-ink-400")}>
                  <td className="px-5 py-3 font-mono text-[13.5px]">{u.login_id}</td>
                  <td className="px-5 py-3 font-semibold">{u.name}</td>
                  <td className="px-5 py-3">{ROLE_LABEL[u.role]}</td>
                  <td className="px-5 py-3">{u.department_id ? dir.deptName(u.department_id) : "—"}</td>
                  <td className="px-5 py-3">
                    {!u.is_active ? <Chip className="bg-canvas text-ink-500 ring-line">사용 중지</Chip>
                      : u.locked_until && new Date(u.locked_until) > new Date() ? <Chip className="bg-amber-50 text-warn ring-amber-200">잠김</Chip>
                      : <Chip className="bg-emerald-50 text-ok ring-emerald-200">사용</Chip>}
                  </td>
                  <td className="num px-5 py-3 text-[13px] text-ink-500">{u.last_login_at ? kstFull(u.last_login_at) : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button type="button" onClick={() => setModal({ user: u })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-700 hover:bg-canvas"><Pencil size={14} />변경</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.loading && !list.data && <Loading />}
          {list.data && !list.data.items.length && <Empty>계정이 없습니다.</Empty>}
          <Pager page={page} pages={pages} total={list.data?.total ?? 0} onPage={setPage} />
        </Card>
      )}
      {modal && <UserModal user={modal.user} onClose={() => setModal(null)} onDone={() => { setModal(null); list.reload(); }} />}
    </>
  );
}

function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-line bg-canvas/50 px-5 py-3 text-[13px] text-ink-500">
      <span>총 <b className="num text-ink-900">{total}</b>건</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white disabled:opacity-35" aria-label="이전 쪽"><ChevronLeft size={16} /></button>
        <span className="num">{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white disabled:opacity-35" aria-label="다음 쪽"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

const RESULT: Record<AuditLog["result"], string> = {
  SUCCESS: "bg-emerald-50 text-ok ring-emerald-200",
  DENIED: "bg-amber-50 text-warn ring-amber-200",
  FAIL: "bg-red-50 text-danger ring-red-200",
};

export function AuditLogs() {
  const today = todayKst();
  const [f, setF] = useState({ date_from: addDays(today, -6), date_to: today, action: "", result: "", service: "", user_id: "" });
  const [applied, setApplied] = useState(f);
  const [page, setPage] = useState(1);
  const list = useApi(
    () => api<Page<AuditLog>>("/admin/audit-logs", {
      query: {
        date_from: applied.date_from, date_to: applied.date_to, action: applied.action.trim() || undefined,
        result: applied.result || undefined, service: applied.service || undefined, user_id: applied.user_id || undefined, page, size: 50,
      },
    }),
    [applied, page],
  );
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.size)) : 1;

  return (
    <>
      <form className="mb-4 flex flex-wrap items-end gap-2.5" onSubmit={(e) => { e.preventDefault(); setApplied(f); setPage(1); }}>
        <Field label="시작일"><input type="date" className={cx(inputCls, "w-[160px]")} value={f.date_from} max={f.date_to} onChange={(e) => setF({ ...f, date_from: e.target.value })} /></Field>
        <Field label="종료일"><input type="date" className={cx(inputCls, "w-[160px]")} value={f.date_to} min={f.date_from} onChange={(e) => setF({ ...f, date_to: e.target.value })} /></Field>
        <Field label="행위"><input className={cx(inputCls, "w-[190px]")} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value.toUpperCase() })} placeholder="예: LOGIN" maxLength={50} /></Field>
        <Field label="결과">
          <select className={cx(inputCls, "w-[120px]")} value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })}>
            <option value="">전체</option><option>SUCCESS</option><option>DENIED</option><option>FAIL</option>
          </select>
        </Field>
        <Field label="서비스">
          <select className={cx(inputCls, "w-[140px]")} value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}>
            <option value="">전체</option><option value="auth">auth</option><option value="reservation">reservation</option><option value="stats">stats</option>
          </select>
        </Field>
        <Field label="사용자 번호"><input className={cx(inputCls, "w-[120px]")} inputMode="numeric" value={f.user_id} onChange={(e) => setF({ ...f, user_id: e.target.value.replace(/\D/g, "") })} /></Field>
        <Btn type="submit" variant="primary" className="h-11">조회</Btn>
      </form>
      {list.error ? <ErrorNotice error={list.error} onRetry={list.reload} /> : (
        <Card className="overflow-hidden">
          <CardHead title="감사 로그" icon={<ScrollText size={18} />} sub="조회만 할 수 있습니다 (수정·삭제 없음)" />
          <table className="w-full text-left text-[14px]">
            <thead><tr className={tableHeadRow}><Th>시각</Th><Th>사용자</Th><Th>서비스</Th><Th>행위</Th><Th>대상</Th><Th>결과</Th><Th>IP</Th></tr></thead>
            <tbody>
              {list.data?.items.map((a) => (
                <tr key={a.id} className={tableRow}>
                  <td className="num px-5 py-2.5 text-[13px]">{kstFull(a.created_at)}</td>
                  <td className="num px-5 py-2.5">{a.user_id ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink-500">{a.service}</td>
                  <td className="px-5 py-2.5 font-mono text-[13px]">{a.action}</td>
                  <td className="max-w-[220px] truncate px-5 py-2.5 text-[13px] text-ink-500">{a.target_type ? `${a.target_type}:${a.target_id ?? ""}` : "—"}</td>
                  <td className="px-5 py-2.5"><Chip className={RESULT[a.result]}>{a.result}</Chip></td>
                  <td className="num px-5 py-2.5 font-mono text-[12.5px] text-ink-500">{a.client_ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.loading && !list.data && <Loading />}
          {list.data && !list.data.items.length && <Empty>조건에 맞는 감사 로그가 없습니다.</Empty>}
          <Pager page={page} pages={pages} total={list.data?.total ?? 0} onPage={setPage} />
        </Card>
      )}
    </>
  );
}
