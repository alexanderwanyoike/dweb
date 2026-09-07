import type { AppSessionGrant } from "./model";

export function grant(
  id: string,
  overrides: Partial<AppSessionGrant> = {},
): AppSessionGrant {
  return {
    request_id: `req_${id}`,
    session_id: id,
    app_id: "spoke.local",
    app_name: "Spoke",
    identity: "alice.jolt",
    requested_capabilities: [],
    granted_capabilities: ["resolve:public"],
    status: "active",
    created_at: 100,
    ...overrides,
  };
}
