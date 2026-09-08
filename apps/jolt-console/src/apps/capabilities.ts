export type CapabilityInfo = {
  code: string;
  label: string;
  kind: "read" | "write" | "pin" | "inventory" | "blocked";
  grantable: boolean;
  broadPath: boolean;
};
const exact = new Map<string, [string, CapabilityInfo["kind"]]>([
  ["resolve:public", ["read public Jolt addresses", "read"]],
  ["fetch:public", ["fetch public content", "read"]],
  ["ingress:read", ["read pending incoming app objects", "read"]],
  ["ingress:send", ["send incoming app objects by identity", "write"]],
  ["ingress:decide", ["accept or reject pending incoming app objects", "write"]]
]);
const scoped: [string, string, CapabilityInfo["kind"]][] = [
  ["publish:encrypted:", "publish encrypted content under", "write"],
  ["publish:", "create or update signed paths under", "write"],
  ["delete:", "delete records under", "write"],
  ["inventory:", "list local published content under", "inventory"],
  ["pin:own:", "pin content it publishes under", "pin"],
  ["encrypt:", "encrypt content under", "write"],
  ["decrypt:", "decrypt content under", "read"],
  ["enumerate:self:", "enumerate public records for this identity under", "read"],
  ["enumerate:any:", "enumerate public records for any identity under", "read"]
];

export function capabilityInfo(code: string): CapabilityInfo {
  const base = {
    code,
    label: code,
    kind: "blocked" as const,
    grantable: false,
    broadPath: false
  };
  const known = exact.get(code);
  if (known) return { ...base, label: known[0], kind: known[1], grantable: true };
  const subscription = parseSubscriptionCapability(code);
  if (subscription)
    return {
      ...base,
      kind: "read",
      grantable: true,
      label: `subscribe to verified records under ${subscription.scope} for ${subscription.identity === "any" ? "any identity" : subscription.identity}`,
      broadPath: isBroadPathScope(subscription.scope)
    };
  const rule = scoped.find(([prefix]) => code.startsWith(prefix));
  if (!rule) return base;
  const [prefix, label, kind] = rule;
  const scope = code.slice(prefix.length);
  return {
    ...base,
    label: `${label} ${scope}`,
    kind,
    grantable: isGrantablePathCapability(prefix, code),
    broadPath: isBroadPathScope(scope)
  };
}

export function isGrantableCapability(code: string) {
  return capabilityInfo(code).grantable;
}

function parseSubscriptionCapability(capability: string) {
  if (!capability.startsWith("subscribe:")) return null;

  const remainder = capability.slice("subscribe:".length);
  const separator = remainder.indexOf(":");
  if (separator <= 0) return null;

  const identity = remainder.slice(0, separator);
  const scope = remainder.slice(separator + 1);
  if (
    !isGrantableSubscriptionIdentity(identity) ||
    !isGrantablePathCapability(`subscribe:${identity}:`, capability)
  ) {
    return null;
  }

  return { identity, scope };
}

function isGrantableSubscriptionIdentity(identity: string) {
  if (identity === "any") return true;
  const label = identity.endsWith(".jolt") ? identity.slice(0, -".jolt".length) : identity;
  return isCanonicalIdentityLabel(label);
}

function isCanonicalIdentityLabel(label: string) {
  // A 32-byte key is 52 unpadded base32 characters; its final character is A or Q.
  return /^[a-z2-7]{51}[aq]$/.test(label);
}

function isGrantablePathCapability(prefix: string, capability: string) {
  if (!capability.startsWith(prefix)) return false;
  const scope = capability.slice(prefix.length);
  return isGrantablePathScope(scope);
}

function isGrantablePathScope(scope: string) {
  if (!scope.startsWith("/") || /[?#\s]/.test(scope)) return false;

  const wildcardCount = [...scope].filter((character) => character === "*").length;
  if (wildcardCount > 1) return false;
  if (wildcardCount === 1) {
    if (!scope.endsWith("/*")) return false;
    return isGrantableExactScopeBase(scope.slice(0, -"/*".length));
  }

  return isGrantableExactScopeBase(scope);
}

function isGrantableExactScopeBase(scope: string) {
  return (
    scope !== "/" &&
    scope
      .split("/")
      .filter((segment) => segment.length > 0)
      .every((segment) => segment !== "." && segment !== "..")
  );
}

function isBroadPathScope(scope: string) {
  return scope === "/*" || scope.endsWith("/*");
}
