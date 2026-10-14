import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { api, apiEvents } from "./api";
import { session, type Session } from "./session";

type Toast = { message: string; tone: "ok" | "warn" | "danger" };

type AppState = {
  me: Session | null;
  /** 503 WRITE_DISABLED 를 받았거나 시스템 상태가 읽기 전용이면 true → 화면 위 안내 띠 */
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  toast: Toast | null;
  flash: (message: string, tone?: Toast["tone"]) => void;
  signIn: (s: Session) => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [me, setMe] = useState<Session | null>(() => session.get());
  const [readOnly, setReadOnly] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const flash = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    setToast({ message, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(() => {
    const onReadOnly = () => setReadOnly(true);
    const onWritable = () => setReadOnly(false);
    const onUnauthorized = () => {
      setMe(null);
      navigate("/login", { replace: true, state: { expired: true } });
    };
    apiEvents.addEventListener("read-only", onReadOnly);
    apiEvents.addEventListener("writable", onWritable);
    apiEvents.addEventListener("unauthorized", onUnauthorized);
    return () => {
      apiEvents.removeEventListener("read-only", onReadOnly);
      apiEvents.removeEventListener("writable", onWritable);
      apiEvents.removeEventListener("unauthorized", onUnauthorized);
    };
  }, [navigate]);

  const signIn = useCallback((s: Session) => {
    session.set(s);
    setMe(s);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* 세션이 이미 끊겼거나 읽기 전용이어도 이 브라우저에서는 지운다 */
    }
    session.clear();
    setMe(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({ me, readOnly, setReadOnly, toast, flash, signIn, signOut }),
    [me, readOnly, toast, flash, signIn, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppStateProvider 가 없습니다");
  return v;
}
