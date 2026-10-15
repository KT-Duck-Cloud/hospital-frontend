/** / (환자): 예약하기, 내 예약(취소), 내 진료기록·영수증 */
import { CalendarCheck, CalendarPlus, FileText, Phone } from "lucide-react";
import { useState } from "react";
import Booking from "../features/Booking";
import Contacts from "../features/Contacts";
import { MyRecords, MyReservations } from "../features/Mine";
import { useAppState } from "../lib/appState";
import { Shell, type NavItem } from "../ui/Shell";

type Tab = "book" | "mine" | "records" | "contacts";
const NAV: NavItem<Tab>[] = [
  { id: "book", label: "예약하기", icon: <CalendarPlus size={20} /> },
  { id: "mine", label: "내 예약", icon: <CalendarCheck size={20} /> },
  { id: "records", label: "진료기록 · 영수증", icon: <FileText size={20} /> },
  { id: "contacts", label: "연락처", icon: <Phone size={20} /> },
];

export default function PatientHome() {
  const { me } = useAppState();
  const [tab, setTab] = useState<Tab>("book");
  return (
    <Shell subtitle="환자" nav={NAV} active={tab} onSelect={setTab} title={NAV.find((n) => n.id === tab)!.label}>
      {tab === "book" && (
        <>
          <div className="mb-5">
            <p className="text-[24px] font-bold tracking-tight">{me?.user.name} 님, 진료 예약을 도와드릴게요.</p>
            <p className="mt-1 text-[15px] text-ink-500">진료과와 의사를 고르면 예약할 수 있는 30분 단위 시간이 나옵니다.</p>
          </div>
          <div className="max-w-[920px]"><Booking onDone={() => setTab("mine")} /></div>
        </>
      )}
      {tab === "mine" && <MyReservations />}
      {tab === "records" && <MyRecords />}
      {tab === "contacts" && <Contacts />}
    </Shell>
  );
}
