"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  acceptInvitationAction,
  cancelInvitationAction,
  changeFactoryUserRoleAction,
  setFactoryUserActiveAction,
} from "@/app/actions/company-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invitation, RbacUser, RoleKey } from "@/lib/rbac/types";

const ROLE_TR: Record<RoleKey, string> = {
  PLATFORM_ADMIN: "Platform Yöneticisi",
  COMPANY_ADMIN: "Fabrika yöneticisi",
  PRODUCTION_USER: "Üretim",
  WAREHOUSE_USER: "Depo",
  SHIPMENT_USER: "Sevkiyat",
  VIEWER: "Salt okunur",
};

const CHANGE_ROLES: Exclude<RoleKey, "PLATFORM_ADMIN">[] = [
  "COMPANY_ADMIN",
  "PRODUCTION_USER",
  "WAREHOUSE_USER",
  "SHIPMENT_USER",
  "VIEWER",
];

export function CompanyUsersPanel({
  users,
  invitations,
  currentUserId,
}: {
  users: RbacUser[];
  invitations: Invitation[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Aktif kullanıcılar</h3>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    {u.firstName} {u.lastName}
                    {u.id === currentUserId ? (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Siz
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{ROLE_TR[u.role]}</Badge>
                      {u.id !== currentUserId ? (
                        <select
                          className="h-8 rounded border border-slate-200 px-2 text-xs"
                          defaultValue={u.role}
                          disabled={pending}
                          onChange={(e) => {
                            const newRole = e.target.value as Exclude<
                              RoleKey,
                              "PLATFORM_ADMIN"
                            >;
                            startTransition(async () => {
                              const r = await changeFactoryUserRoleAction({
                                targetUserId: u.id,
                                newRole,
                              });
                              if (!r.ok) globalThis.alert(r.error);
                              router.refresh();
                            });
                          }}
                        >
                          {CHANGE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_TR[r]}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.status === "active" ? "Aktif" : "Pasif"}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.id !== currentUserId ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const r = await setFactoryUserActiveAction({
                              targetUserId: u.id,
                              active: u.status !== "active",
                            });
                            if (!r.ok) globalThis.alert(r.error);
                            router.refresh();
                          });
                        }}
                      >
                        {u.status === "active" ? "Pasifleştir" : "Aktifleştir"}
                      </Button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Bekleyen davetler</h3>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {invitations.filter((i) => i.status === "pending").length === 0 ? (
            <p className="p-4 text-sm text-slate-600">Bekleyen davet yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations
                  .filter((i) => i.status === "pending")
                  .map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="text-sm">{i.email}</TableCell>
                      <TableCell>
                        {i.firstName} {i.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROLE_TR[i.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const r = await acceptInvitationAction(i.id);
                              if (!r.ok) globalThis.alert(r.error);
                              router.refresh();
                            });
                          }}
                        >
                          Kabul (simülasyon)
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const r = await cancelInvitationAction(i.id);
                              if (!r.ok) globalThis.alert(r.error);
                              router.refresh();
                            });
                          }}
                        >
                          İptal
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
