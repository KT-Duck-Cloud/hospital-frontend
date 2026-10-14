/**
 * /manage (의사·원무과장·관리자·원장): 대기열·접수, 환자 관리(원장: 검색·등록, 관리자: 등록만), 계정·감사 로그, 현황, 진료(EMR)·수납(샘플).
 * 메뉴는 역할에 맞게 보여 주지만, 권한은 서버가 API 마다 다시 검사한다 (403 이면 안내).
 */
import { BarChart3, ClipboardList, Receipt, ScrollText, Stethoscope, UserCog, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AdminUsers, AuditLogs } from "../features/Admin";
import { CheckinDesk, TodayQueue } from "../features/FrontDesk";
import { DepartmentStats, HospitalStats } from "../features/Ops";
import Patients from "../features/Patients";
import { SampleBilling, SampleEmr } from "../features/Samples";
import { useAppState } from "../lib/appState";
import type { Role } from "../lib/types";
import { Shell, type NavItem } from "../ui/Shell";
import { Segmented } from "../ui/kit";

type Tab = "queue" | "patients" | "accounts" | "stats" | "emr" | "billing";
const ALL: (NavItem<Tab> & { roles: Role[] })[] = [
  { id: "queue", label: "대기열 · 접수", icon: <ClipboardList size={20} />, roles: ["DIRECTOR"] },
  { id: "patients", label: "환자 관리", icon: <Users size={20} />, roles: ["ADMIN", "DIRECTOR"] },
  { id: "accounts", label: "계정 · 감사 로그", icon: <UserCog size={20} />, roles: ["ADMIN", "DIRECTOR"] },
  { id: "stats", label: "현황", icon: <BarChart3 size={20} />, roles: ["DIRECTOR"] },
  { id: "emr", label: "진료 (EMR)", icon: <Stethoscope size={20} />, roles: ["DOCTOR", "DIRECTOR"] },
  { id: "billing", label: "수납", icon: <Receipt size={20} />, roles: ["MANAGER", "DIRECTOR"] },
];
const SUBTITLE: Partial<Record<Role, string>> = { DOCTOR: "진료", MANAGER: "원무과", ADMIN: "관리자", DIRECTOR: "원장" };

function Split<T extends string>({ options, render }: { options: { value: T; label: string }[]; render: (v: T) => ReactNode }) {
  const [v, setV] = useState<T>(options[0].value);
  return (
    <>
      <div className="mb-4"><Segmented value={v} onChange={setV} options={options} /></div>
      <div key={v}>{render(v)}</div>
    </>
  );
}

export default function Manage() {
  const { me } = useAppState();
  const role = me!.user.role;
  const nav = ALL.filter((n) => n.roles.includes(role));
  const [tab, setTab] = useState<Tab>(nav[0]?.id ?? "emr");
  return (
    <Shell subtitle={SUBTITLE[role] ?? "관리"} nav={nav} active={tab} onSelect={setTab} title={ALL.find((n) => n.id === tab)!.label}>
      {tab === "queue" && (
        <Split options={[{ value: "queue", label: "오늘 대기열" }, { value: "checkin", label: "현장 접수" }]}
          render={(v) => (v === "queue" ? <TodayQueue /> : <CheckinDesk />)} />
      )}
      {tab === "patients" && <Patients canRegister canSearch={role !== "ADMIN"} />}
      {tab === "accounts" && (
        <Split options={[{ value: "users", label: "계정" }, { value: "audit", label: "감사 로그" }]}
          render={(v) => (v === "users" ? <AdminUsers /> : <AuditLogs />)} />
      )}
      {tab === "stats" && (
        <Split options={[{ value: "hospital", label: "병원 전체 (오늘)" }, { value: "dept", label: "부서 · 의사별" }]}
          render={(v) => (v === "hospital" ? <HospitalStats /> : <DepartmentStats />)} />
      )}
      {tab === "emr" && <SampleEmr />}
      {tab === "billing" && <SampleBilling />}
      {tab === "accounts" && <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-400"><ScrollText size={14} />계정 변경과 감사 로그 조회도 감사 로그에 남습니다.</p>}
    </Shell>
  );
}
