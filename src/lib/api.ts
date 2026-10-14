import { session } from "./session";

/**
 * API 호출 (같은 주소의 /api/v1/*. nginx·Ingress 가 서비스별로 넘긴다).
 * - 오류는 api-spec.md 형식 {code, message, request_id} 을 ApiError 로 바꾼다.
 * - 503 WRITE_DISABLED → 'read-only' 이벤트 (화면 위 안내 띠), 쓰기가 성공하면 'writable' 이벤트.
 * - 401 → 세션을 지우고 'unauthorized' 이벤트 (로그인 화면으로).
 * - 403 은 그대로 던진다. 화면이 "권한이 없습니다" 안내를 보여 준다 (버튼을 숨기는 것만으로 권한을 처리하지 않는다).
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
  ) {
    super(message);
  }
  get forbidden() {
    return this.status === 403;
  }
}

export const apiEvents = new EventTarget();

type Query = Record<string, string | number | boolean | null | undefined>;
type Options = { method?: string; query?: Query; body?: unknown; headers?: Record<string, string>; auth?: boolean };

const FRIENDLY: Record<string, string> = {
  FORBIDDEN: "권한이 없습니다. 서버가 이 계정의 요청을 거부했습니다.",
  WRITE_DISABLED: "현재 읽기 전용 모드입니다. 조회만 할 수 있습니다.",
  DB_UNAVAILABLE: "데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  RECORD_UNAVAILABLE: "지금은 진료기록을 볼 수 없습니다.",
  INTERNAL_ERROR: "서버 오류가 발생했습니다.",
  NETWORK: "서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
};

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const url = new URL(`/api/v1${path}`, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = session.get()?.token;
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "NETWORK", FRIENDLY.NETWORK);
  }
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const code: string = data?.code ?? (res.status === 422 ? "VALIDATION" : `HTTP_${res.status}`);
    let message: string = FRIENDLY[code] ?? data?.message ?? `요청을 처리하지 못했습니다 (${res.status})`;
    if (res.status === 422) message = "입력값을 확인해 주세요.";
    if (code === "WRITE_DISABLED") apiEvents.dispatchEvent(new Event("read-only"));
    if (res.status === 401 && opts.auth !== false) {
      session.clear();
      apiEvents.dispatchEvent(new Event("unauthorized"));
    }
    throw new ApiError(res.status, code, message, data?.request_id);
  }
  if (method !== "GET") apiEvents.dispatchEvent(new Event("writable"));
  return data as T;
}

export const toApiError = (e: unknown): ApiError =>
  e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", e instanceof Error ? e.message : "알 수 없는 오류");
