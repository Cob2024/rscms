"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  ArrowUpDown,
  Wallet,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Edit,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/members/status-badge";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { StatusDialog } from "@/components/members/status-dialog";
import { formatPesewas } from "@/lib/formatting/currency";
import { MemberStatus } from "@prisma/client";

interface MemberRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  rotationPosition: number;
  status: MemberStatus;
  joinedAt: string;
  totalObligationsPesewas: number;
  totalPaidPesewas: number;
  outstandingBalancePesewas: number;
  totalPayoutsPesewas: number;
}

interface GroupRecord {
  id: string;
  name: string;
  memberCount: number;
  contributionAmount: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [group, setGroup] = useState<GroupRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [statusChangeMember, setStatusChangeMember] = useState<{
    id: string;
    fullName: string;
    currentStatus: MemberStatus;
  } | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load members.");
      } else {
        setMembers(data.members || []);
        if (data.group) {
          setGroup(data.group);
        }
      }
    } catch {
      setError("Network error while loading group members.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Derived metrics
  const maxCapacity = group?.memberCount ?? 4;
  const contributionAmount = group?.contributionAmount ?? 25000;
  const monthlyTarget = contributionAmount * maxCapacity;
  const isCapacityReached = members.length >= maxCapacity;

  const totalPaid = members.reduce((sum, m) => sum + m.totalPaidPesewas, 0);
  const totalOutstanding = members.reduce((sum, m) => sum + m.outstandingBalancePesewas, 0);
  const activeCount = members.filter((m) => m.status === MemberStatus.ACTIVE).length;
  const occupiedPositions = members.map((m) => m.rotationPosition);

  // Filtering
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phoneNumber.includes(searchQuery) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage the {maxCapacity} group participants and their fixed rotation seats.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          disabled={isCapacityReached}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isCapacityReached ? `Capacity Reached (${members.length}/${maxCapacity})` : "Register Member"}
        </Button>
      </div>

      {/* Capacity Alert if full */}
      {isCapacityReached && (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Group capacity reached ({members.length} / {maxCapacity} members)
              </p>
              <p className="text-xs text-muted-foreground">
                Want to add more people to the group? You can easily increase group capacity in Group Settings.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/settings">Adjust Capacity in Settings</Link>
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotation Seats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length} / {maxCapacity}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Paid</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPesewas(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">From verified payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatPesewas(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">Unpaid member obligations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Group Target</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPesewas(monthlyTarget)}</div>
            <p className="text-xs text-muted-foreground">{formatPesewas(contributionAmount)} monthly per member</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="LEFT">Left</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Seat</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead className="text-right">Paid to Date</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Payouts</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Loading member records...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <p className="font-medium">No members found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {members.length === 0
                        ? `Register group members to establish the ${maxCapacity}-month payout rotation.`
                        : "No members matched your search criteria."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-center font-semibold">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {member.rotationPosition}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/members/${member.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {member.fullName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {member.email || "No email"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {member.phoneNumber}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatPesewas(member.totalPaidPesewas)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-600">
                      {formatPesewas(member.outstandingBalancePesewas)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      {formatPesewas(member.totalPayoutsPesewas)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="View Details"
                        >
                          <Link href={`/members/${member.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingMember(member)}
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setStatusChangeMember({
                              id: member.id,
                              fullName: member.fullName,
                              currentStatus: member.status,
                            })
                          }
                          title="Change Status"
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <MemberFormDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchMembers}
        occupiedPositions={occupiedPositions}
        maxCapacity={maxCapacity}
      />

      {/* Edit Member Dialog */}
      {editingMember && (
        <MemberFormDialog
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          onSuccess={fetchMembers}
          occupiedPositions={occupiedPositions}
          maxCapacity={maxCapacity}
          initialData={editingMember}
        />
      )}

      {/* Change Status Dialog */}
      <StatusDialog
        isOpen={Boolean(statusChangeMember)}
        onClose={() => setStatusChangeMember(null)}
        onSuccess={fetchMembers}
        member={statusChangeMember}
      />
    </div>
  );
}
