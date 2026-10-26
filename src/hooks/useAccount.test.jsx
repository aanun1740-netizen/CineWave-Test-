import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  signOut: vi.fn(),
  callback: null,
}));
vi.mock("../services/backend", () => ({
  signOut: mocks.signOut,
  client: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: (callback) => {
        mocks.callback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));
import useAccount from "./useAccount";
const session = { user: { id: "user-1", email: "user@example.invalid" } };
let chain;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.rpc.mockResolvedValue({ data: false });
  mocks.signOut.mockResolvedValue({ failed: false });
  chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({
      data: { display_name: "Name", preferred_language: "hy" },
    })),
    then: (resolve) =>
      Promise.resolve({ data: [{ movie_id: "1" }] }).then(resolve),
    insert: vi.fn(async () => ({ error: null })),
    delete: vi.fn(() => chain),
  };
  mocks.from.mockReturnValue(chain);
});
it("keeps account watchlist writes scoped to the authenticated user", async () => {
  mocks.getSession.mockResolvedValue({ data: { session } });
  const { result } = renderHook(() => useAccount());
  await waitFor(() => expect(result.current.cloudReady).toBe(true));
  expect(result.current.list.has("catalog:1")).toBe(true);
  await act(() => result.current.toggle({ id: "catalog:2" }));
  expect(chain.insert).toHaveBeenCalledWith({
    user_id: "user-1",
    movie_id: "2",
  });
  expect(result.current.list.has("catalog:2")).toBe(true);
  expect(localStorage.getItem("cinewave:my-list")).toBeNull();
  await act(() => result.current.toggle({ id: "catalog:1" }));
  expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
  expect(chain.eq).toHaveBeenCalledWith("movie_id", "1");
  expect(result.current.list.has("catalog:1")).toBe(false);
});
it("does not record a cloud list success when the write fails", async () => {
  mocks.getSession.mockResolvedValue({ data: { session } });
  chain.insert.mockResolvedValue({ error: Error("denied") });
  const { result } = renderHook(() => useAccount());
  await waitFor(() => expect(result.current.cloudReady).toBe(true));
  await act(async () => {
    await expect(result.current.toggle({ id: "catalog:2" })).rejects.toThrow(
      "listFailed",
    );
  });
  expect(result.current.list.has("catalog:2")).toBe(false);
});
it("restores the guest list after local logout", async () => {
  localStorage.setItem("cinewave:my-list", JSON.stringify(["catalog:guest"]));
  mocks.getSession.mockResolvedValue({ data: { session } });
  const { result } = renderHook(() => useAccount());
  await waitFor(() => expect(result.current.cloudReady).toBe(true));
  await act(() => result.current.logout());
  expect(mocks.signOut).toHaveBeenCalledTimes(1);
  expect(result.current.session).toBeNull();
  expect([...result.current.list]).toEqual(["catalog:guest"]);
});
it("ignores malformed guest-list storage instead of breaking startup", async () => {
  localStorage.setItem(
    "cinewave:my-list",
    JSON.stringify({ unexpected: true }),
  );
  const { result } = renderHook(() => useAccount());
  await waitFor(() => expect(result.current.ready).toBe(true));
  expect([...result.current.list]).toEqual([]);
});
