import { expect, it } from "vitest";
import { capabilityInfo } from "./capabilities";

it.each(["constructor", "toString", "__proto__", "unknown:grant"])(
  "keeps unknown permission %s visible and blocked",
  (code) => {
    expect(capabilityInfo(code)).toMatchObject({
      label: code,
      grantable: false,
    });
  },
);
