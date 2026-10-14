/**
 * 예약 생성용 X-Request-ID (중복 방지, docs/api-spec.md 2장).
 * - 새 예약 시도마다 새 UUID. 같은 시도를 다시 보낼 때(네트워크 오류·응답 못 받음)는 같은 값을 다시 쓴다.
 * - 성공하거나 입력이 바뀌면 버린다 → 다음 시도는 새 값.
 */
export function newUuid(): string {
  // randomUUID 는 HTTPS·localhost 에서만 있다. 사내망 http 에서도 되도록 getRandomValues 로 v4 를 만든다.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export class IdempotencyKey {
  private value: string | null = null;

  /** 지금 시도의 키. 없으면 새로 만든다 (재시도면 같은 값). */
  current(): string {
    if (this.value === null) this.value = newUuid();
    return this.value;
  }

  /** 성공했거나 입력이 바뀌었을 때: 다음 시도는 새 키 */
  reset(): void {
    this.value = null;
  }
}
