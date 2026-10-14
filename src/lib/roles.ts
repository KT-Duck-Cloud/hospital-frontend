import type { Role } from "./types";

/** 로그인 화면 역할 탭 순서와 이름 */
export const ROLES: Role[] = ["PATIENT", "NURSE", "DOCTOR", "MANAGER", "ADMIN", "DEPT_HEAD", "DIRECTOR", "DEVELOPER", "TESTER"];

export const ROLE_LABEL: Record<Role, string> = {
  PATIENT: "일반이용자",
  NURSE: "간호사",
  DOCTOR: "의사",
  MANAGER: "원무과장",
  ADMIN: "관리자",
  DEPT_HEAD: "부서장",
  DIRECTOR: "원장",
  DEVELOPER: "개발자",
  TESTER: "테스터",
};

/** 화면(경로)별로 들어올 수 있는 역할. 화면을 고르는 기준일 뿐, 권한은 서버가 API 마다 다시 검사한다 (403). */
export const PAGE_ROLES: Record<"/" | "/workspace" | "/manage", Role[]> = {
  "/": ["PATIENT"],
  "/workspace": ["NURSE", "DEPT_HEAD", "DEVELOPER", "TESTER"],
  "/manage": ["DOCTOR", "MANAGER", "ADMIN", "DIRECTOR"],
};

export const homeOf = (role: Role): string =>
  (Object.entries(PAGE_ROLES).find(([, roles]) => roles.includes(role))?.[0] as string) ?? "/login";

/** 시스템 상태(S1)를 볼 수 있는 역할 — 상단 사이트 배지를 이 역할만 보여 준다 */
export const STATUS_ROLES: Role[] = ["DIRECTOR", "DEVELOPER", "TESTER"];
