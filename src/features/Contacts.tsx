/**
 * 연락처 (R19 GET /contacts): 병원 대표 번호, 진료과 대표 번호, 직원 업무용 연락처.
 * 어느 번호를 전체로 보여 주고 어느 번호를 가릴지는 서버가 정한다 (shared/phone.py). 화면은 받은 값만 보여 준다.
 */
import { Building2, Lock, Phone, UsersRound } from "lucide-react";
import { api } from "../lib/api";
import { useAppState } from "../lib/appState";
import { ROLE_LABEL } from "../lib/roles";
import type { ContactsOut, Role } from "../lib/types";
import { useApi } from "../lib/useApi";
import { Avatar, Card, CardHead, Chip, Empty, ErrorNotice, Loading, tableHeadRow, tableRow, Th } from "../ui/kit";
import { useDirectory } from "./directory";

/** 역할마다 직원 연락처가 어디까지 나오는지 안내 (실제 범위는 서버가 정한다) */
const STAFF_SCOPE: Partial<Record<Role, string>> = {
  NURSE: "우리 부서 직원의 업무용 연락처가 보입니다.",
  DEPT_HEAD: "우리 부서 직원의 업무용 연락처가 보입니다.",
  DOCTOR: "우리 부서 부서장의 업무용 연락처가 보입니다.",
  DIRECTOR: "모든 부서 부서장의 업무용 연락처가 보입니다.",
  MANAGER: "전체 직원의 업무용 연락처가 보입니다.",
};

function Phone_({ value, masked }: { value: string | null; masked: boolean }) {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className="num inline-flex items-center gap-1.5 font-mono text-[14px]">
      {value}
      {masked && <Lock size={13} className="text-ink-400" aria-label="가려진 번호" />}
    </span>
  );
}

export default function Contacts() {
  const { me } = useAppState();
  const role = me!.user.role;
  const dir = useDirectory();
  const contacts = useApi(() => api<ContactsOut>("/contacts"), []);

  if (contacts.loading && !contacts.data) return <Loading />;
  if (contacts.error) return <ErrorNotice error={contacts.error} onRetry={contacts.reload} />;
  const data = contacts.data;
  if (!data) return null;
  const anyMasked = data.departments.some((d) => d.phone_is_masked) || data.staff.some((s) => s.work_phone_is_masked);

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Phone size={22} /></span>
        <div>
          <p className="text-[13px] text-ink-400">병원 대표 번호</p>
          <p className="num font-mono text-[22px] font-bold tracking-tight">{data.hospital_phone ?? "등록된 번호가 없습니다"}</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHead title="진료과 대표 번호" icon={<Building2 size={18} />} />
        <table className="w-full text-left text-[14.5px]">
          <thead><tr className={tableHeadRow}><Th>진료과</Th><Th>대표 번호</Th></tr></thead>
          <tbody>
            {data.departments.map((d) => (
              <tr key={d.id} className={tableRow}>
                <td className="px-5 py-3.5 font-semibold">{d.name}</td>
                <td className="px-5 py-3.5"><Phone_ value={d.phone} masked={d.phone_is_masked} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.departments.length && <Empty>진료과가 없습니다.</Empty>}
      </Card>

      <Card className="overflow-hidden">
        <CardHead title="직원 업무용 연락처" icon={<UsersRound size={18} />} right={<Chip className="bg-canvas text-ink-500 ring-line">{STAFF_SCOPE[role] ?? "이 역할은 직원 연락처를 볼 수 없습니다."}</Chip>} />
        {data.staff.length ? (
          <table className="w-full text-left text-[14.5px]">
            <thead><tr className={tableHeadRow}><Th>이름</Th><Th>역할</Th><Th>부서</Th><Th>연락처</Th></tr></thead>
            <tbody>
              {data.staff.map((s) => (
                <tr key={s.id} className={tableRow}>
                  <td className="px-5 py-3.5"><span className="flex items-center gap-2.5"><Avatar name={s.name} size={30} /><b className="font-semibold">{s.name}</b></span></td>
                  <td className="px-5 py-3.5 text-[13.5px] text-ink-500">{ROLE_LABEL[s.role]}</td>
                  <td className="px-5 py-3.5">{s.department_id ? dir.deptName(s.department_id) : "—"}</td>
                  <td className="px-5 py-3.5"><Phone_ value={s.work_phone} masked={s.work_phone_is_masked} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>표시할 직원 연락처가 없습니다.</Empty>}
      </Card>

      {anyMasked && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-ink-400">
          <Lock size={13} /> 자물쇠가 있는 번호는 이 역할에 공개되지 않아 가려져 있습니다.
        </p>
      )}
    </div>
  );
}
