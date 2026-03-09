"use client";

import { useMemo, useState } from "react";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { drawerTransition, drawerVariants } from "@/lib/animations";

interface TeamRow {
  id: string;
  nome: string;
  email: string;
  telefono: string;
  ruoloCantiere: string;
  cantiere: string;
  stato: "presente" | "assente";
  oreMese: number;
  cantieri: string[];
  documentiCount: number;
  timbratureCount: number;
}

export function TeamTable({ data }: { data: TeamRow[] }) {
  const [selected, setSelected] = useState<TeamRow | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<TeamRow>[]>(
    () => [
      { accessorKey: "nome", header: "Nome" },
      { accessorKey: "ruoloCantiere", header: "Ruolo cantiere" },
      { accessorKey: "cantiere", header: "Cantiere assegnato" },
      {
        accessorKey: "stato",
        header: "Stato",
        cell: ({ row }) => (
          <Badge variant={row.original.stato === "presente" ? "success" : "outline"}>{row.original.stato}</Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>
            Dettaglio
          </Button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  const resetPassword = async (email: string) => {
    setResetMsg(null);
    const response = await fetch("/api/team/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = await response.json();
    setResetMsg(response.ok ? "Email reset password inviata" : body.error ?? "Errore invio reset password");
  };

  return (
    <div className="relative space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-[#E8EAF0] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <Table>
          <TableHeader className="bg-[#F8F9FC]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[#4A5068]">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-[#FBFCFF]">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelected(null)} />
          <motion.aside
            initial="initial"
            animate="animate"
            exit="exit"
            variants={drawerVariants}
            transition={drawerTransition}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-[#E8EAF0] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
          >
            <h3 className="text-lg font-bold tracking-[-0.02em]">Dettaglio dipendente</h3>
            <p className="text-sm text-[#4A5068]">{selected.nome}</p>

            <div className="mt-4 grid gap-2 rounded-2xl border border-[#E8EAF0] bg-[#FBFCFF] p-4 text-sm text-[#0A0C14]">
              <p>Email: {selected.email || "N/D"}</p>
              <p>Telefono: {selected.telefono || "N/D"}</p>
              <p>Ruolo cantiere: {selected.ruoloCantiere}</p>
              <p>Cantiere assegnato: {selected.cantiere}</p>
              <p>Stato oggi: {selected.stato}</p>
              <p>Ore mese: {selected.oreMese}</p>
              <p>Cantieri: {selected.cantieri.length ? selected.cantieri.join(", ") : "N/D"}</p>
              <p>Timbrature mese: {selected.timbratureCount}</p>
              <p>Documenti: {selected.documentiCount}</p>
            </div>

            {selected.email ? (
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => resetPassword(selected.email)}>
                  Invia reset password
                </Button>
              </div>
            ) : null}
            {resetMsg ? <p className="mt-2 text-xs text-[#4A5068]">{resetMsg}</p> : null}

            <Button variant="ghost" className="mt-6" onClick={() => setSelected(null)}>
              Chiudi
            </Button>
          </motion.aside>
        </>
      ) : null}
    </div>
  );
}
