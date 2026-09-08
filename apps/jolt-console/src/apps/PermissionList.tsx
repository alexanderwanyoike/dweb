import { capabilityInfo } from "./capabilities";

export function PermissionList({ grants }: { grants: string[] }) {
  return (
    <ul className="access-permissions">
      {grants.map((code) => {
        const permission = capabilityInfo(code);
        return (
          <li key={code}>
            <span>{permission.label}</span>
            {permission.label !== code && <code>{code}</code>}
            {permission.broadPath && <small>Includes every path within this scope.</small>}
            {!permission.grantable && <strong>Unrecognised or administrative permission</strong>}
          </li>
        );
      })}
    </ul>
  );
}
