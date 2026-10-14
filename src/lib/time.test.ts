import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, dateLabel, kstDate, kstShort, kstTime, todayKst, weekday } from "./time.ts";

describe("시간: UTC → KST", () => {
  it("UTC 를 KST 로 보여 준다", () => {
    assert.equal(kstTime("2026-10-14T00:00:00.000Z"), "09:00");
    assert.equal(kstDate("2026-10-13T15:00:00.000Z"), "2026-10-14"); // KST 자정
    assert.equal(kstDate("2026-10-13T14:59:00.000Z"), "2026-10-13");
    assert.equal(kstShort("2026-10-14T08:30:00.000Z"), "10.14 17:30");
  });

  it("오늘(KST)은 UTC 날짜와 다를 수 있다", () => {
    assert.equal(todayKst(new Date("2026-10-13T16:00:00Z")), "2026-10-14");
  });

  it("날짜 계산과 요일", () => {
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(weekday("2026-10-14"), "수");
    assert.equal(dateLabel("2026-10-14"), "2026년 10월 14일 (수)");
  });
});
