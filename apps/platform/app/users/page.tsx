import Link from "next/link";
import { Users as UsersIcon } from "lucide-react";
import { getUserRoleCounts, listUsers } from "@guma-commerce/db";
import { requireSuperAdmin } from "@/lib/session";
import { PlatformShell } from "@/components/platform-shell";
import { FilterBar } from "@/components/filter-bar";
import { UserActions } from "@/components/user-actions";
import { EmptyState, Panel, StatusPill } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";

interface PageProps {
  searchParams: Promise<{ search?: string; role?: string; status?: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  seller_owner: "Seller owner",
  seller_staff: "Seller staff",
  customer: "Customer",
};

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await requireSuperAdmin();
  const filters = await searchParams;
  const [rows, roleCounts] = await Promise.all([listUsers(filters), getUserRoleCounts()]);

  const countMap = new Map(roleCounts.map((r) => [r.role, r.count]));

  return (
    <PlatformShell
      title="Users"
      subtitle={`${formatNumber(rows.length)} shown`}
      user={{ displayName: session.displayName, email: session.email }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <span
            key={role}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{countMap.get(role) ?? 0}</span>
          </span>
        ))}
      </div>

      <FilterBar
        basePath="/users"
        searchPlaceholder="Search by email…"
        selects={[
          {
            name: "role",
            label: "All roles",
            options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
          },
          {
            name: "status",
            label: "All statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-5 w-5" />} title="No users match your filters" />
      ) : (
        <Panel className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Shop</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((u) => {
                  const label = u.name ?? u.email ?? "user";
                  return (
                    <tr key={u.id} className="transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                            {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{u.name ?? u.email}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.email}
                              {!u.emailVerified && (
                                <span className="ml-1.5 rounded bg-amber-100 px-1 text-[10px] font-semibold text-amber-700">
                                  unverified
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {u.tenantId ? (
                          <Link
                            href={`/tenants/${u.tenantId}`}
                            className="text-muted-foreground hover:text-primary hover:underline"
                          >
                            {u.tenantName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <UserActions
                          userId={u.id}
                          label={label}
                          role={u.role}
                          status={u.status}
                          isSelf={u.id === session.userId}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </PlatformShell>
  );
}
