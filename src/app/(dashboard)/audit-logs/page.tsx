"use client";

import { useCallback,useEffect,useState } from "react";
import { Search } from "lucide-react";
import { Card,CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { supabaseBrowser } from "@/lib/auth/supabase-browser";
import { formatDateTime } from "@/lib/formatting/date";
type Log={id:string;action:string;entityType:string;entityId:string;oldValues:unknown;newValues:unknown;createdAt:string};
export default function AuditLogsPage(){const [logs,setLogs]=useState<Log[]>([]);const [query,setQuery]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");const load=useCallback(async(value:string)=>{const {data:{session}}=await supabaseBrowser.auth.getSession().catch(()=>({data:{session:null}}));const headers:Record<string,string>={};if(session?.access_token)headers["Authorization"]=`Bearer ${session.access_token}`;const response=await fetch(`/api/audit-logs?q=${encodeURIComponent(value)}`,{headers});const body=await response.json();if(response.ok)setLogs(body.logs);else setError(body.error??"Could not load audit history.");setLoading(false);},[]);useEffect(()=>{const timer=window.setTimeout(()=>void load(query),200);return()=>window.clearTimeout(timer);},[load,query]);  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087F5B]">Accountability</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102A43]">Audit History</h1>
        <p className="mt-1 text-sm text-[#475569]">
          Administrative actions that changed member, cycle and financial records.
        </p>
      </header>
      {error && (
        <div role="alert" className="rounded-md border border-[#FECACA] bg-[#FEECEB] p-3 text-sm font-semibold text-[#991B1B]">
          {error}
        </div>
      )}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
        <Input
          className="pl-9"
          value={query}
          onChange={(event) => {
            setLoading(true);
            setQuery(event.target.value);
          }}
          placeholder="Filter by action or record..."
        />
      </div>
      <Card className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC]">
                <TableHead className="text-[#102A43]">Time</TableHead>
                <TableHead className="text-[#102A43]">Action</TableHead>
                <TableHead className="text-[#102A43]">Record</TableHead>
                <TableHead className="text-[#102A43]">Record ID</TableHead>
                <TableHead className="text-[#102A43]">Change details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[#64748B]">
                    Loading audit history…
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-[#64748B]">
                    No matching audit records.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/70">
                    <TableCell className="whitespace-nowrap text-xs text-[#475569]">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-semibold text-sm text-[#102A43]">
                      {log.action.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-[#102A43] font-mono border border-slate-200">
                        {log.entityType}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#64748B]">
                      {log.entityId.slice(0, 12)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-[#64748B] font-mono">
                      {JSON.stringify(log.newValues ?? log.oldValues ?? {})}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
