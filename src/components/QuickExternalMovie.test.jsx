import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  rows: [],
  savedPayload: null,
}));
vi.mock("../services/backend", () => ({
  client: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => ({ data: mocks.rows, error: null }),
        }),
      }),
      update: (payload) => {
        mocks.savedPayload = payload;
        return {
          eq: () => ({
            select: async () => ({ data: [{ id: 1 }], error: null }),
          }),
        };
      },
      insert: (payload) => {
        mocks.savedPayload = payload;
        return {
          select: async () => ({ data: [{ id: 2 }], error: null }),
        };
      },
    }),
  },
}));
import QuickExternalMovie from "./QuickExternalMovie";

beforeEach(() => {
  mocks.rows = [];
  mocks.savedPayload = null;
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Quick add external movie release year", () => {
  it("renders only the release year input in each language", async () => {
    const { rerender } = render(<QuickExternalMovie language="en" />);
    expect(screen.getByRole("spinbutton", { name: "Release year" })).toBeTruthy();
    expect(document.querySelector('input[name="day"]')).toBeNull();
    expect(document.querySelector('input[name="month"]')).toBeNull();
    rerender(<QuickExternalMovie language="hy" />);
    expect(screen.getByRole("spinbutton", { name: "Թողարկման տարեթիվ" })).toBeTruthy();
    rerender(<QuickExternalMovie language="ru" />);
    expect(screen.getByRole("spinbutton", { name: "Год выпуска" })).toBeTruthy();
  });

  it("keeps a pre-existing full date when editing without changing its year", async () => {
    mocks.rows = [{
      id: 1,
      title_en: "Animals",
      title_ru: "Животные",
      title_hy: "Կենդանիներ",
      genre_names: ["Thriller"],
      overview_en: "A story",
      poster_path: null,
      external_watch_url: "https://api.nextembed.ws/embed/movie/92733",
      release_date: "2026-11-05",
      terms_confirmed: true,
      is_published: true,
    }];
    const user = userEvent.setup();
    render(<QuickExternalMovie language="en" />);
    await screen.findByRole("button", { name: "Edit" });
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("spinbutton", { name: "Release year" }).value).toBe("2026");
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form"));
    await waitFor(() => expect(mocks.savedPayload?.release_date).toBe("2026-11-05"));
  });
});
