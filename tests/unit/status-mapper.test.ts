import { describe, expect, it } from "vitest";
import {
  isFinalOrderStatus,
  mapProviderStatus,
} from "@/lib/rumahotp/status-mapper";

describe("RumahOTP status mapper", () => {
  it("maps documented provider statuses", () => {
    expect(mapProviderStatus("received")).toBe("OTP_RECEIVED");
    expect(mapProviderStatus("completed")).toBe("COMPLETED");
    expect(mapProviderStatus("canceled")).toBe("CANCELED");
    expect(mapProviderStatus("expiring")).toBe("EXPIRED");
  });

  it("prioritizes an OTP payload over a waiting status", () => {
    expect(mapProviderStatus("waiting", true)).toBe("OTP_RECEIVED");
  });

  it("recognizes internal final statuses", () => {
    expect(isFinalOrderStatus("REFUNDED")).toBe(true);
    expect(isFinalOrderStatus("WAITING_OTP")).toBe(false);
  });
});
