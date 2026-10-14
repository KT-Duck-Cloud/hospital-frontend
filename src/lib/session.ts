import type { User } from "./types";

/**
 * 로그인 세션. 출입증(JWT)은 브라우저 탭을 닫으면 사라지도록 sessionStorage 에만 둔다.
 * 비밀번호는 어디에도 저장하지 않는다.
 */
export type Session = { token: string; user: User; homePath: string };

const KEY = "rsv.session";

export const session = {
  get(): Session | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },
  set(s: Session): void {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* 저장할 수 없으면(사생활 보호 모드 등) 이번 화면에서만 쓴다 */
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* 무시 */
    }
  },
};
