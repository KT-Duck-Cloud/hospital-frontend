/** API 응답 모양 (docs/api-spec.md). 시각 문자열은 UTC ISO(…Z). */

export type Role =
  | "PATIENT" | "NURSE" | "DOCTOR" | "MANAGER" | "ADMIN" | "DEPT_HEAD" | "DIRECTOR" | "DEVELOPER" | "TESTER";

export type User = {
  id: number;
  name: string;
  role: Role;
  department_id: number | null;
  patient_id: number | null;
  login_id?: string;
};

export type LoginOut = { access_token: string; token_type: string; expires_in: number; user: User; home_path: string };

export type Department = { id: number; code: string; name: string };
export type Doctor = { id: number; department_id: number; name: string; room_no: string | null };

export type Reservation = {
  id: number;
  request_id: string;
  patient_id: number;
  patient_name: string | null;
  chart_no: string | null;
  department_id: number;
  doctor_id: number | null;
  queue_no: number | null;
  reserved_at: string;
  visit_type: "FIRST" | "RETURN";
  status: "BOOKED" | "CANCELED";
  checkin_status: "NOT_CHECKED_IN" | "CHECKED_IN";
  checked_in_at: string | null;
  memo: string | null;
  created_by: number | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Page<T> = { items: T[]; page: number; size: number; total: number };

export type QueueItem = {
  reservation_id: number;
  queue_no: number;
  department_id: number;
  patient_id: number;
  patient_name: string;
  chart_no: string;
  doctor_id: number | null;
  doctor_name: string | null;
  reserved_at: string;
  checked_in_at: string;
};
export type QueueOut = { date: string; department_id: number | null; items: QueueItem[] };

export type PatientSummary = { id: number; chart_no: string; name: string; birth_date: string; phone_masked: string | null };
export type Patient = { id: number; chart_no: string; name: string; birth_date: string; phone: string | null; created_at: string };
export type PatientDetail = Patient & { recent_reservations: Reservation[] };

export type SlotsOut = { doctor_id: number; date: string; slot_minutes: number; available: string[] };

export type MedicalRecord = {
  id: number; reservation_id: number | null; doctor_id: number; doctor_name: string | null;
  diagnosis: string; note: string; created_at: string;
};
export type Receipt = {
  id: number; reservation_id: number | null; amount: number; pay_status: "PAID" | "UNPAID" | "REFUNDED";
  paid_at: string | null; created_at: string;
};

export type SystemStatus = {
  site: string; read_only_mode: boolean; version: string; services: Record<string, "ok" | "fail">;
  db: "ok" | "fail"; checked_at: string;
};

export type Counts = { total: number; booked: number; canceled: number; checked_in: number; not_checked_in: number };
export type DepartmentCounts = Counts & { department_id: number; code: string; name: string };
export type DoctorCounts = Counts & { doctor_id: number; doctor_name: string; department_id: number };
export type DepartmentReport = { date_from: string; date_to: string; items: DepartmentCounts[] };
export type DoctorReport = { date_from: string; date_to: string; department_id: number | null; items: DoctorCounts[] };
export type HospitalReport = { date: string; totals: Counts; departments: (DepartmentCounts & { waiting: number })[] };

export type AdminUser = {
  id: number; login_id: string; name: string; role: Role; department_id: number | null; patient_id: number | null;
  is_active: boolean; locked_until: string | null; last_login_at: string | null; created_at: string; updated_at: string;
};
export type AuditLog = {
  id: number; user_id: number | null; service: string; action: string; target_type: string | null;
  target_id: string | null; request_id: string | null; client_ip: string | null; result: "SUCCESS" | "DENIED" | "FAIL";
  created_at: string;
};
