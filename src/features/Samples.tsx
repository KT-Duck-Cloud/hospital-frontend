/** 진료(EMR)·수납 탭: 이번 범위에 기능이 없어 "샘플 데이터" 고정 예시만 보여 준다. 서버에 아무것도 보내지 않는다. */
import { Info, Receipt, Stethoscope } from "lucide-react";
import { Card, CardHead, Chip, Field, inputCls, SampleBadge, tableHeadRow, tableRow, Th } from "../ui/kit";

const Notice = ({ children }: { children: string }) => (
  <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
    <Info size={18} className="shrink-0 text-warn" />
    <p className="text-[14px] text-ink-700">{children}</p>
  </div>
);

export function SampleEmr() {
  return (
    <>
      <Notice>진료(EMR) 기능은 이번 범위에 없습니다. 아래는 화면 예시이며, 실제 환자 정보가 아니고 저장되지 않습니다.</Notice>
      <div className="grid grid-cols-[320px_1fr] gap-4">
        <Card className="overflow-hidden">
          <CardHead title="진료 대기" icon={<Stethoscope size={18} />} right={<SampleBadge />} />
          <ul className="divide-y divide-line px-2 pb-2">
            {["예시 환자 A", "예시 환자 B", "예시 환자 C"].map((n, i) => (
              <li key={n} className="flex items-center gap-3 px-3 py-3">
                <span className="num grid h-7 w-7 place-items-center rounded-lg bg-canvas font-mono text-[13px] font-semibold">{i + 1}</span>
                <span className="flex-1 text-[15px] font-semibold">{n}</span>
                <Chip className="bg-canvas text-ink-500 ring-line">예시</Chip>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[18px] font-bold">예시 환자 A <span className="ml-2 text-[14px] font-normal text-ink-400">진료 기록 작성 예시</span></h3>
            <SampleBadge />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="주호소"><input className={inputCls} disabled value="(예시) 기침이 3일째 계속됨" readOnly /></Field>
            <Field label="진단"><input className={inputCls} disabled value="(예시) 상기도 감염" readOnly /></Field>
            <Field label="처방"><input className={inputCls} disabled value="(예시) 해열제 3일" readOnly /></Field>
            <Field label="다음 진료"><input className={inputCls} disabled value="(예시) 1주 후" readOnly /></Field>
          </div>
          <p className="mt-5 text-[13px] text-ink-400">실제 진료기록은 암호화되어 저장되며, 환자 본인은 "내 진료기록"에서 볼 수 있습니다.</p>
        </Card>
      </div>
    </>
  );
}

export function SampleBilling() {
  const rows = [
    { no: "예시-001", item: "초진 진찰료", amount: 18000, status: "결제 완료" },
    { no: "예시-002", item: "재진 진찰료", amount: 12000, status: "미결제" },
    { no: "예시-003", item: "물리치료", amount: 9000, status: "환불" },
  ];
  return (
    <>
      <Notice>수납 기능은 이번 범위에 없습니다. 아래는 화면 예시이며, 실제 결제 정보가 아니고 저장되지 않습니다.</Notice>
      <Card className="overflow-hidden">
        <CardHead title="수납 대기" icon={<Receipt size={18} />} right={<SampleBadge />} />
        <table className="w-full text-left text-[14.5px]">
          <thead><tr className={tableHeadRow}><Th>번호</Th><Th>항목</Th><Th className="text-right">금액</Th><Th>상태</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no} className={tableRow}>
                <td className="px-5 py-3.5 font-mono text-[13px] text-ink-500">{r.no}</td>
                <td className="px-5 py-3.5">{r.item}</td>
                <td className="num px-5 py-3.5 text-right font-semibold">{r.amount.toLocaleString("ko-KR")}원</td>
                <td className="px-5 py-3.5"><Chip className="bg-canvas text-ink-500 ring-line">{r.status}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
