/** /login: 역할 탭 + 로그인. 로그인 응답의 home_path 로 이동한다. 계정·비밀번호는 코드에 넣지 않는다. */
import { Cross, LogIn, TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { api, toApiError } from "../lib/api";
import { useAppState } from "../lib/appState";
import { ROLE_LABEL, ROLES } from "../lib/roles";
import type { LoginOut, Role } from "../lib/types";
import { Bare } from "../ui/Shell";
import { Btn, cx, Field, inputCls } from "../ui/kit";

const ROLE_HINT: Record<Role, string> = {
  PATIENT: "예약하기, 내 예약, 내 진료기록·영수증",
  NURSE: "오늘 대기열, 현장 접수, 환자 검색",
  DOCTOR: "관리 화면 (진료 기능은 샘플)",
  MANAGER: "관리 화면 (수납 기능은 샘플)",
  ADMIN: "관리 화면 · 계정과 감사 로그",
  DEPT_HEAD: "대기열, 부서 현황",
  DIRECTOR: "관리 화면 · 전체 업무와 현황",
  DEVELOPER: "시스템 상태",
  TESTER: "업무 화면 전체와 시스템 상태",
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAppState();
  const [role, setRole] = useState<Role>("PATIENT");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; readOnly?: boolean } | null>(
    (location.state as { expired?: boolean } | null)?.expired ? { message: "로그인이 끝났습니다. 다시 로그인해 주세요." } : null,
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const out = await api<LoginOut>("/auth/login", { method: "POST", body: { login_id: loginId.trim(), password }, auth: false });
      setPassword("");
      signIn({ token: out.access_token, user: out.user, homePath: out.home_path });
      // 고른 역할 탭과 계정 역할이 달라도, 화면은 서버가 알려 준 계정 역할 기준(home_path)으로 간다
      navigate(out.home_path, { replace: true });
    } catch (err) {
      const e2 = toApiError(err);
      setPassword("");
      if (e2.code === "WRITE_DISABLED") setError({ readOnly: true, message: "현재 읽기 전용 모드입니다. 대기 사이트에서는 로그인할 수 없습니다." });
      else if (e2.status === 401) setError({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
      else if (e2.status === 429) setError({ message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." });
      else if (e2.status === 422) setError({ message: "아이디와 비밀번호를 입력해 주세요." });
      else setError({ message: e2.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Bare>
      <div className="grid min-h-screen place-items-center px-6 py-10">
        <div className="rise w-full max-w-[560px]">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white"><Cross size={26} strokeWidth={2.6} /></span>
            <div className="leading-tight">
              <p className="text-[22px] font-bold tracking-tight">병원 예약 시스템</p>
              <p className="text-[14px] text-ink-400">역할을 고르고 계정으로 로그인하세요</p>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-7">
            <p className="mb-2 text-[13px] font-medium text-ink-500">역할</p>
            <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="역할">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={role === r}
                  onClick={() => setRole(r)}
                  className={cx(
                    "h-10 rounded-xl text-[14px] font-medium transition",
                    role === r ? "bg-brand-600 text-white" : "border border-line text-ink-500 hover:bg-canvas",
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[13px] text-ink-400">{ROLE_LABEL[role]} · {ROLE_HINT[role]}</p>

            <div className="mt-6 space-y-4">
              <Field label="아이디">
                <input className={inputCls} value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" maxLength={50} required />
              </Field>
              <Field label="비밀번호">
                <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" maxLength={128} required />
              </Field>
            </div>

            {error && (
              <p role="alert" className={cx("mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[14px]", error.readOnly ? "bg-amber-50 text-warn" : "bg-red-50 text-danger")}>
                <TriangleAlert size={16} className="shrink-0" /> {error.message}
              </p>
            )}

            <Btn type="submit" variant="primary" className="mt-6 h-12 w-full text-[15px]" disabled={busy || !loginId || !password}>
              <LogIn size={18} /> {busy ? "로그인 중" : "로그인"}
            </Btn>
          </form>
          <p className="mt-4 text-center text-[12.5px] text-ink-400">계정은 관리자에게 받으세요. 로그인한 계정의 역할에 맞는 화면으로 이동합니다.</p>
        </div>
      </div>
    </Bare>
  );
}
