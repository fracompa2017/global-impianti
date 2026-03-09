import { NewEmployeeDialog } from "@/components/admin/new-employee-dialog";
import { TeamTable } from "@/components/admin/team-table";
import { getTeamRows } from "@/lib/supabase/queries";

export default async function AdminTeamPage() {
  const team = await getTeamRows();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-[#0A0C14]">Team</h1>
          <p className="text-sm text-[#4A5068]">Gestione dipendenti e stato presenze</p>
        </div>

        <div className="flex gap-2">
          <NewEmployeeDialog />
        </div>
      </header>
      <div className="gi-divider" />

      <TeamTable data={team} />
    </div>
  );
}
