import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IdempotencyKey, newUuid } from "./requestId.ts";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("X-Request-ID", () => {
  it("같은 시도를 다시 보내면 같은 값, reset 뒤에는 새 값", () => {
    const key = new IdempotencyKey();
    const first = key.current();
    assert.equal(key.current(), first); // 재시도
    key.reset();                        // 성공 또는 입력 변경
    const second = key.current();
    assert.notEqual(second, first);
    assert.match(first, UUID_V4);
    assert.match(second, UUID_V4);
  });

  it("randomUUID 가 없는 곳(사내망 http)에서도 v4 UUID 를 만든다", () => {
    const orig = crypto.randomUUID;
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      const ids = new Set(Array.from({ length: 200 }, () => newUuid()));
      assert.equal(ids.size, 200);
      for (const id of ids) assert.match(id, UUID_V4);
    } finally {
      Object.defineProperty(crypto, "randomUUID", { value: orig, configurable: true });
    }
  });
});
