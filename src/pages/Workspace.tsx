/**
 * /workspace (간호사·부서장·개발자·테스터): 피그마 간호사 화면.
 * 메뉴는 역할별로 다르게 보여 주지만, 권한은 서버가 API 마다 다시 검사한다 (403 이면 안내).
 */
import { Activity, BarChart3, ClipboardCheck, ClipboardList, Users } from "lucide-react";
import { useState } from "react";
import { CheckinDesk, TodayQueue } from "../features/FrontDesk";
import { DepartmentStats, SystemStatusView } from "../features/Ops";
import Patients from "../features/Patients";
import { useAppState } from "../lib/appState";
import type { Role } from "../lib/types";
import { Shell, type NavItem } from "../ui/Shell";

type Tab = "queue" | "checkin" | "patients" | "dept" | "system";
const ALL: (NavItem<Tab> & { roles: Role[] })[] = [
  { id: "queue", label: "오늘 대기열", icon: <ClipboardList size={20} />, roles: ["NURSE", "DEPT_HEAD", "TESTER"] },
  { id: "checkin", label: "현장 접수", icon: <ClipboardCheck size={20} />, roles: ["NURSE", "TESTER"] },
  { id: "patients", label: "환자 검색", icon: <Users size={20} />, roles: ["NURSE", "TESTER"] },
  { id: "dept", label: "부서 현황", icon: <BarChart3 size={20} />, roles: ["DEPT_HEAD"] },
  { id: "system", label: "시스템 상태", icon: <Activity size={20} />, roles: ["DEVELOPER", "TESTER"] },
];

const SUBTITLE: Partial<Record<Role, string>> = { NURSE: "간호 · 접수 데스크", DEPT_HEAD: "부서장", DEVELOPER: "개발자", TESTER: "테스터" };

export default function Workspace() {
  const { me } = useAppState();
  const role = me!.user.role;
  const nav = ALL.filter((n) => n.roles.includes(role));
  const [tab, setTab] = useState<Tab>(nav[0]?.id ?? "queue");
  return (
    <Shell subtitle={SUBTITLE[role] ?? "업무"} nav={nav} active={tab} onSelect={setTab} title={ALL.find((n) => n.id === tab)!.label}>
      {tab === "queue" && <TodayQueue />}
      {tab === "checkin" && <CheckinDesk />}
      {tab === "patients" && <Patients canRegister={role === "NURSE" || role === "TESTER"} />}
      {tab === "dept" && <DepartmentStats />}
      {tab === "system" && <SystemStatusView />}
    </Shell>
  );
}
