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
    expect(screen.getByRole("textbox", { name: "Trailer link (YouTube or Vimeo, optional)" })).toBeTruthy();
    rerender(<QuickExternalMovie language="hy" />);
    expect(screen.getByRole("spinbutton", { name: "Թողարկման տարեթիվ" })).toBeTruthy();
    rerender(<QuickExternalMovie language="ru" />);
    expect(screen.getByRole("spinbutton", { name: "Год выпуска" })).toBeTruthy();
  });

  it("saves English, Russian, and Armenian descriptions independently", async () => {
    const { rerender } = render(<QuickExternalMovie language="en" />);
    expect(screen.getByRole("textbox", { name: "English description (EN)" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Russian description (RU)" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Armenian description (HY)" })).toBeTruthy();
    rerender(<QuickExternalMovie language="hy" />);
    expect(screen.getByRole("textbox", { name: "Նկարագրություն՝ հայերեն (HY)" })).toBeTruthy();

    const form = document.querySelector(".quick-external form");
    const fill = (name, value) =>
      fireEvent.change(form.elements.namedItem(name), { target: { value } });
    fill("title_en", "Film");
    fill("overview_en", "An English description");
    fill("overview_ru", "Описание на русском");
    fill("overview_hy", "Նկարագրությունը հայերեն");
    fill("year", "2026");
    fill("external_watch_url", "https://api.nextembed.ws/embed/movie/92733");
    form.elements.namedItem("terms_confirmed").checked = true;
    fireEvent.submit(form);
    await waitFor(() => expect(mocks.savedPayload?.overview_en).toBe("An English description"));
    expect(mocks.savedPayload.overview_ru).toBe("Описание на русском");
    expect(mocks.savedPayload.overview_hy).toBe("Նկարագրությունը հայերեն");
  });

  it("keeps a pre-existing full date when editing without changing its year", async () => {
    mocks.rows = [{
      id: 1,
      title_en: "Animals",
      title_ru: "Животные",
      title_hy: "Կենդանիներ",
      genre_names: ["Thriller"],
      overview_en: "A story",
      overview_ru: "История",
      overview_hy: "Պատմություն",
      poster_path: null,
      trailer_url: "https://youtu.be/abcdefghijk",
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
    expect(document.querySelector('textarea[name="overview_ru"]').value).toBe("История");
    expect(document.querySelector('textarea[name="overview_hy"]').value).toBe("Պատմություն");
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form"));
    await waitFor(() => expect(mocks.savedPayload?.release_date).toBe("2026-11-05"));
    expect(mocks.savedPayload.trailer_url).toBe("https://youtu.be/abcdefghijk");
    expect(mocks.savedPayload.overview_ru).toBe("История");
    expect(mocks.savedPayload.overview_hy).toBe("Պատմություն");
  });

  it("stores a valid YouTube trailer link and shows an error for an unrelated host", async () => {
    render(<QuickExternalMovie language="en" />);
    const fields = document.querySelector(".quick-external form");
    fireEvent.change(fields.elements.namedItem("title_en"), { target: { value: "Film" } });
    fireEvent.change(fields.elements.namedItem("external_watch_url"), { target: { value: "https://api.nextembed.ws/embed/movie/92733" } });
    fireEvent.change(fields.elements.namedItem("year"), { target: { value: "2026" } });
    fields.elements.namedItem("terms_confirmed").checked = true;

    fireEvent.change(fields.elements.namedItem("trailer_url"), { target: { value: "https://example.com/other" } });
    fireEvent.submit(fields);
    expect(mocks.savedPayload).toBeNull();
    expect(screen.getByText("Use a valid HTTPS YouTube or Vimeo trailer link.")).toBeTruthy();

    fireEvent.change(fields.elements.namedItem("trailer_url"), { target: { value: "https://www.youtube.com/watch?v=abcdefghijk" } });
    fireEvent.submit(fields);
    await waitFor(() => expect(mocks.savedPayload?.trailer_url).toBe("https://www.youtube.com/watch?v=abcdefghijk"));
    expect(mocks.savedPayload.release_date).toBe("2026-01-01");
  });
});
