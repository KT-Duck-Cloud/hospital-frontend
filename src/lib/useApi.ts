import { useEffect, useState } from "react";
import { toApiError, type ApiError } from "./api";

type State<T> = { data?: T; error?: ApiError; loading: boolean };

/** 화면이 열릴 때·deps 가 바뀔 때 API 를 불러온다. fetcher 가 null 이면 부르지 않는다. */
export function useApi<T>(fetcher: (() => Promise<T>) | null, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ loading: fetcher !== null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!fetcher) {
      setState({ loading: false });
      return;
    }
    let alive = true;
    setState((s) => ({ data: s.data, loading: true }));
    fetcher()
      .then((data) => alive && setState({ data, loading: false }))
      .catch((e) => alive && setState({ error: toApiError(e), loading: false }));
    return () => {
      alive = false;
    };
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((n) => n + 1) };
}
