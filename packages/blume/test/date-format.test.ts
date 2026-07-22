import { describe, expect, it } from "bun:test";

import {
  DEFAULT_DATE_FORMAT,
  resolveDateFormatOptions,
} from "../src/core/date-format.ts";

describe("resolveDateFormatOptions", () => {
  it("defaults to the long form in UTC", () => {
    expect(resolveDateFormatOptions()).toStrictEqual({
      dateStyle: "long",
      timeZone: "UTC",
    });
  });

  it("keeps the long form for the default constant", () => {
    expect(resolveDateFormatOptions(DEFAULT_DATE_FORMAT)).toStrictEqual({
      dateStyle: "long",
      timeZone: "UTC",
    });
  });

  it("adds UTC to a component house style", () => {
    expect(
      resolveDateFormatOptions({
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    ).toStrictEqual({
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
      year: "numeric",
    });
  });

  it("lets a configured time zone override the UTC default", () => {
    expect(
      resolveDateFormatOptions({ dateStyle: "short", timeZone: "Asia/Tokyo" })
    ).toStrictEqual({ dateStyle: "short", timeZone: "Asia/Tokyo" });
  });

  it("produces options Intl.DateTimeFormat accepts", () => {
    const date = new Date("2026-07-21T00:00:00Z");
    const long = new Intl.DateTimeFormat(
      "en",
      resolveDateFormatOptions()
    ).format(date);
    const numeric = new Intl.DateTimeFormat(
      "en",
      resolveDateFormatOptions({
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    ).format(date);
    expect(long).toBe("July 21, 2026");
    expect(numeric).toBe("07/21/2026");
  });
});
