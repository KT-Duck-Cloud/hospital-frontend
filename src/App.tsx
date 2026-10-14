import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAppState } from "./lib/appState";
import { homeOf, PAGE_ROLES } from "./lib/roles";
import Login from "./pages/Login";
import Manage from "./pages/Manage";
import PatientHome from "./pages/PatientHome";
import Workspace from "./pages/Workspace";

/** 로그인과 화면별 역할 확인. 화면을 고르는 용도이고, 실제 권한은 서버가 API 마다 검사한다. */
function RequireRole({ page, children }: { page: keyof typeof PAGE_ROLES; children: ReactNode }) {
  const { me } = useAppState();
  if (!me) return <Navigate to="/login" replace />;
  if (!PAGE_ROLES[page].includes(me.user.role)) return <Navigate to={homeOf(me.user.role)} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireRole page="/"><PatientHome /></RequireRole>} />
      <Route path="/workspace" element={<RequireRole page="/workspace"><Workspace /></RequireRole>} />
      <Route path="/manage" element={<RequireRole page="/manage"><Manage /></RequireRole>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
