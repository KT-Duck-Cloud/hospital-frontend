import { useMemo } from "react";
import { api } from "../lib/api";
import type { Department, Doctor } from "../lib/types";
import { useApi } from "../lib/useApi";

/** 진료과·의사 목록 (R6·R7, 로그인한 모두). 이름을 찾는 데 쓴다. */
export function useDirectory() {
  const deps = useApi(() => api<Department[]>("/departments"), []);
  const docs = useApi(() => api<Doctor[]>("/doctors"), []);
  return useMemo(() => {
    const departments = deps.data ?? [];
    const doctors = docs.data ?? [];
    const deptName = (id: number | null | undefined) => departments.find((d) => d.id === id)?.name ?? (id ? `진료과 #${id}` : "—");
    const doctorName = (id: number | null | undefined) => doctors.find((d) => d.id === id)?.name ?? (id ? `의사 #${id}` : "지정 안 함");
    return { departments, doctors, deptName, doctorName, loading: deps.loading || docs.loading, error: deps.error ?? docs.error };
  }, [deps.data, docs.data, deps.loading, docs.loading, deps.error, docs.error]);
}
