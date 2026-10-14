/** 시간 규칙: API 는 UTC(…Z), 화면은 KST. 날짜만 주고받는 값(YYYY-MM-DD)은 KST 날짜다. */
const KST = "Asia/Seoul";

const ymdFmt = new Intl.DateTimeFormat("en-CA", { timeZone: KST, year: "numeric", month: "2-digit", day: "2-digit" });
const hmFmt = new Intl.DateTimeFormat("ko-KR", { timeZone: KST, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** UTC ISO → KST 날짜 "2026-10-14" */
export const kstDate = (iso: string | Date): string => ymdFmt.format(typeof iso === "string" ? new Date(iso) : iso);

/** UTC ISO → KST 시각 "09:30" */
export const kstTime = (iso: string): string => hmFmt.format(new Date(iso));

/** UTC ISO → "10.14 09:30" */
export const kstShort = (iso: string): string => `${kstDate(iso).slice(5).replace("-", ".")} ${kstTime(iso)}`;

/** UTC ISO → "2026.10.14 09:30" */
export const kstFull = (iso: string): string => `${kstDate(iso).replaceAll("-", ".")} ${kstTime(iso)}`;

/** 오늘 KST 날짜 */
export const todayKst = (now: Date = new Date()): string => kstDate(now);

/** "2026-10-14" + n일 */
export const addDays = (ymd: string, n: number): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
};

const WEEK = "일월화수목금토";

/** "2026-10-14" → 요일 한 글자 */
export const weekday = (ymd: string): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  return WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

/** "2026-10-14" → "2026년 10월 14일 (수)" */
export const dateLabel = (ymd: string): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일 (${weekday(ymd)})`;
};
