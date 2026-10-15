/** 시스템 상태(S1), 부서·의사 현황(S2·S3), 병원 전체 현황(S4) */
import { Activity, Ban, BarChart3, CalendarCheck, CircleCheck, ClipboardList, Clock, Database, RefreshCw, Server, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";
import { addDays, dateLabel, kstFull, todayKst } from "../lib/time";
import type { DepartmentReport, DoctorReport, HospitalReport, SystemStatus } from "../lib/types";
import { useApi } from "../lib/useApi";
import { Btn, Card, CardHead, cx, Empty, ErrorNotice, Field, inputCls, Kpi, Loading, tableHeadRow, tableRow, Th } from "../ui/kit";

const SITE_LABEL: Record<string, string> = { hospital: "병원 (온프레미스)", aws: "AWS", krdr: "국내 DR", local: "로컬 개발" };
const SERVICE_LABEL: Record<string, string> = { auth: "인증 서비스", reservation: "예약 서비스", stats: "현황 서비스" };

/* ───────────── 시스템 상태 (S1) ───────────── */
export function SystemStatusView() {
  const s = useApi(() => api<SystemStatus>("/system/status"), []);
  if (s.loading && !s.data) return <Loading />;
  if (s.error) return <ErrorNotice error={s.error} onRetry={s.reload} />;
  const d = s.data!;
  const rows = [...Object.entries(d.services), ["db", d.db] as const];
  const bad = rows.filter(([, v]) => v !== "ok").length;
  return (
    <>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[24px] font-bold tracking-tight">{bad ? `점검이 필요한 곳이 ${bad}곳 있습니다` : "모든 서비스가 정상입니다"}</p>
          <p className="mt-1 text-[15px] text-ink-500">{kstFull(d.checked_at)} 확인 · 각 서비스의 /readyz 를 1초 안에 확인한 결과입니다.</p>
        </div>
        <Btn onClick={s.reload}><RefreshCw size={16} /> 다시 확인</Btn>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="사이트" value={SITE_LABEL[d.site] ?? d.site} unit="" icon={<Server size={19} />} tone="bg-brand-50 text-brand-600" />
        <Kpi label="쓰기" value={d.read_only_mode ? "읽기 전용" : "허용"} unit="" sub="READ_ONLY_MODE" icon={<TriangleAlert size={19} />} tone={d.read_only_mode ? "bg-amber-50 text-warn" : "bg-emerald-50 text-ok"} />
        <Kpi label="앱 버전" value={d.version} unit="" sub="이미지 태그 (Git 커밋)" icon={<Activity size={19} />} tone="bg-sky-50 text-sky-700" />
      </div>
      <Card className="mt-4">
        <CardHead title="서비스·DB" icon={<Database size={18} />} />
        <ul className="divide-y divide-line px-2 pb-2">
          {rows.map(([name, v]) => (
            <li key={name} className="flex items-center gap-3.5 px-3 py-3.5">
              <span className={cx("h-2.5 w-2.5 rounded-full", v === "ok" ? "bg-ok pulse-ok" : "bg-danger")} />
              <span className="flex-1 text-[15px] font-semibold">{name === "db" ? "데이터베이스" : SERVICE_LABEL[name] ?? name}</span>
              <span className={cx("flex items-center gap-1.5 text-[14px] font-medium", v === "ok" ? "text-ok" : "text-danger")}>
                {v === "ok" ? <><CircleCheck size={16} />정상</> : <><TriangleAlert size={16} />응답 없음</>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ───────────── 공통: 기간 고르기 ───────────── */
function RangePicker({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const today = todayKst();
  const presets = [
    { label: "오늘", from: today, to: today },
    { label: "최근 7일", from: addDays(today, -6), to: today },
    { label: "최근 30일", from: addDays(today, -29), to: today },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2.5">
      <Field label="시작일"><input type="date" className={cx(inputCls, "w-[170px]")} value={from} max={to} onChange={(e) => e.target.value && onChange(e.target.value, to)} /></Field>
      <Field label="종료일"><input type="date" className={cx(inputCls, "w-[170px]")} value={to} min={from} onChange={(e) => e.target.value && onChange(from, e.target.value)} /></Field>
      {presets.map((p) => (
        <Btn key={p.label} variant={from === p.from && to === p.to ? "soft" : "ghost"} className="h-11" onClick={() => onChange(p.from, p.to)}>{p.label}</Btn>
      ))}
      <span className="ml-auto pb-2.5 text-[13px] text-ink-400">날짜는 KST, 예약 시각 기준</span>
    </div>
  );
}

const Bars = ({ items }: { items: { key: string; label: string; total: number; checked: number }[] }) => {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="flex h-[190px] items-end gap-5 px-6 pb-5">
      {items.map((b) => (
        <div key={b.key} className="flex flex-1 flex-col items-center gap-2">
          <span className="num text-[13px] font-semibold text-ink-700">{b.total}</span>
          <div className="relative flex w-full max-w-[72px] items-end overflow-hidden rounded-lg bg-canvas" style={{ height: 110 }}>
            <div className="flex w-full flex-col justify-end rounded-lg bg-brand-200" style={{ height: `${(b.total / max) * 100}%` }}>
              <div className="w-full rounded-lg bg-brand-600" style={{ height: `${b.total ? (b.checked / b.total) * 100 : 0}%` }} />
            </div>
          </div>
          <span className="max-w-full truncate text-[12.5px] text-ink-500">{b.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ───────────── 부서·의사 현황 (S2·S3) ───────────── */
export function DepartmentStats() {
  const [range, setRange] = useState({ from: addDays(todayKst(), -6), to: todayKst() });
  const q = { date_from: range.from, date_to: range.to };
  const deps = useApi(() => api<DepartmentReport>("/stats/departments", { query: q }), [range.from, range.to]);
  const docs = useApi(() => api<DoctorReport>("/stats/doctors", { query: q }), [range.from, range.to]);

  return (
    <>
      <RangePicker from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
      {deps.error ? <ErrorNotice error={deps.error} onRetry={deps.reload} /> : !deps.data ? <Loading /> : (
        <>
          <div className="grid grid-cols-4 gap-4">
            {(() => {
              const sum = (k: "total" | "canceled" | "checked_in" | "not_checked_in") => deps.data!.items.reduce((a, i) => a + i[k], 0);
              return (
                <>
                  <Kpi label="예약" value={sum("total")} unit="건" sub="취소 포함 전체" icon={<CalendarCheck size={19} />} tone="bg-brand-50 text-brand-600" />
                  <Kpi label="접수" value={sum("checked_in")} unit="건" icon={<ClipboardList size={19} />} tone="bg-emerald-50 text-ok" />
                  <Kpi label="접수 전" value={sum("not_checked_in")} unit="건" icon={<Clock size={19} />} tone="bg-amber-50 text-warn" />
                  <Kpi label="취소" value={sum("canceled")} unit="건" icon={<Ban size={19} />} tone="bg-red-50 text-danger" />
                </>
              );
            })()}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_1.3fr] gap-4">
            <Card>
              <CardHead title="부서별 예약" icon={<BarChart3 size={18} />} sub="진한 색 = 접수" />
              <Bars items={deps.data.items.map((i) => ({ key: String(i.department_id), label: i.name, total: i.total, checked: i.checked_in }))} />
            </Card>
            <Card className="overflow-hidden">
              <CardHead title="부서별 건수" />
              <table className="w-full text-left text-[14.5px]">
                <thead><tr className={tableHeadRow}><Th>부서</Th><Th className="text-right">예약</Th><Th className="text-right">접수</Th><Th className="text-right">접수 전</Th><Th className="text-right">취소</Th></tr></thead>
                <tbody>
                  {deps.data.items.map((i) => (
                    <tr key={i.department_id} className={tableRow}>
                      <td className="px-5 py-3 font-semibold">{i.name}</td>
                      <td className="num px-5 py-3 text-right">{i.total}</td>
                      <td className="num px-5 py-3 text-right text-ok">{i.checked_in}</td>
                      <td className="num px-5 py-3 text-right">{i.not_checked_in}</td>
                      <td className="num px-5 py-3 text-right text-danger">{i.canceled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
      <Card className="mt-4 overflow-hidden">
        <CardHead title="의사별 실적" sub={dateLabel(range.from) + (range.from !== range.to ? ` ~ ${dateLabel(range.to)}` : "")} />
        {docs.error ? <div className="p-5"><ErrorNotice error={docs.error} onRetry={docs.reload} /></div> : !docs.data ? <Loading /> : docs.data.items.length ? (
          <table className="w-full text-left text-[14.5px]">
            <thead><tr className={tableHeadRow}><Th>의사</Th><Th className="text-right">예약</Th><Th className="text-right">접수</Th><Th className="text-right">접수 전</Th><Th className="text-right">취소</Th><Th>접수율</Th></tr></thead>
            <tbody>
              {docs.data.items.map((i) => {
                const rate = i.booked ? Math.round((i.checked_in / i.booked) * 100) : 0;
                return (
                  <tr key={i.doctor_id} className={tableRow}>
                    <td className="px-5 py-3 font-semibold">{i.doctor_name}</td>
                    <td className="num px-5 py-3 text-right">{i.total}</td>
                    <td className="num px-5 py-3 text-right text-ok">{i.checked_in}</td>
                    <td className="num px-5 py-3 text-right">{i.not_checked_in}</td>
                    <td className="num px-5 py-3 text-right text-danger">{i.canceled}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2"><div className="h-2 w-28 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand-600" style={{ width: `${rate}%` }} /></div><span className="num text-[13px] text-ink-500">{rate}%</span></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <Empty>의사가 없습니다.</Empty>}
      </Card>
    </>
  );
}

/* ───────────── 병원 전체 현황 (S4) ───────────── */
export function HospitalStats() {
  const [date, setDate] = useState(todayKst());
  const r = useApi(() => api<HospitalReport>("/stats/hospital", { query: { date } }), [date]);
  return (
    <>
      <div className="mb-4 flex items-end gap-2.5">
        <Field label="날짜"><input type="date" className={cx(inputCls, "w-[170px]")} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
        <Btn variant="soft" className="h-11" onClick={() => setDate(todayKst())}>오늘</Btn>
        <Btn className="h-11" onClick={r.reload}><RefreshCw size={16} /> 새로고침</Btn>
      </div>
      {r.error ? <ErrorNotice error={r.error} onRetry={r.reload} /> : !r.data ? <Loading /> : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Kpi label="예약" value={r.data.totals.total} unit="건" sub={dateLabel(r.data.date)} icon={<CalendarCheck size={19} />} tone="bg-brand-50 text-brand-600" />
            <Kpi label="진료 대기" value={r.data.departments.reduce((a, d) => a + d.waiting, 0)} unit="명" icon={<Clock size={19} />} tone="bg-amber-50 text-warn" />
            <Kpi label="접수 전" value={r.data.totals.not_checked_in} unit="건" icon={<ClipboardList size={19} />} tone="bg-slate-100 text-slate-600" />
            <Kpi label="취소" value={r.data.totals.canceled} unit="건" icon={<Ban size={19} />} tone="bg-red-50 text-danger" />
          </div>
          <Card className="mt-4 overflow-hidden">
            <CardHead title="부서별 대기" sub="대기 = 접수 후 진료 전 (진료중·진료완료는 제외)" />
            <table className="w-full text-left text-[14.5px]">
              <thead><tr className={tableHeadRow}><Th>부서</Th><Th className="text-right">예약</Th><Th className="text-right">대기</Th><Th className="text-right">접수 전</Th><Th className="text-right">취소</Th></tr></thead>
              <tbody>
                {r.data.departments.map((d) => (
                  <tr key={d.department_id} className={tableRow}>
                    <td className="px-5 py-3 font-semibold">{d.name}</td>
                    <td className="num px-5 py-3 text-right">{d.total}</td>
                    <td className="num px-5 py-3 text-right font-semibold text-warn">{d.waiting}</td>
                    <td className="num px-5 py-3 text-right">{d.not_checked_in}</td>
                    <td className="num px-5 py-3 text-right text-danger">{d.canceled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
