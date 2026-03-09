import { CantiereCard } from "@/components/admin/cantiere-card";
import { NewCantiereDialog } from "@/components/admin/new-cantiere-dialog";
import { getCantieriList } from "@/lib/supabase/queries";

export default async function AdminCantieriPage({
  searchParams,
}: {
  searchParams: { stato?: string };
}) {
  const stato = searchParams.stato;
  const cantieri = await getCantieriList(stato);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-[#0A0C14]">Cantieri</h1>
          <p className="text-sm text-[#4A5068]">Gestione completa stato e avanzamento lavori</p>
        </div>
        <NewCantiereDialog />
      </header>
      <div className="gi-divider" />

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ["tutti", "Tutti"],
          ["pianificato", "Pianificati"],
          ["in_corso", "In corso"],
          ["completato", "Completati"],
          ["sospeso", "Sospesi"],
        ].map(([value, label]) => (
          <a
            key={value}
            href={`/admin/cantieri?stato=${value}`}
            className={`rounded-full border px-3 py-1.5 transition-colors ${stato === value || (!stato && value === "tutti") ? "border-[#3B6FE8] bg-[linear-gradient(135deg,#EEF3FF_0%,#F0EBFF_100%)] text-[#3B6FE8]" : "border-[#E8EAF0] bg-white text-[#4A5068] hover:border-[#DCE8FF] hover:bg-[#F8F9FC]"}`}
          >
            {label}
          </a>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cantieri.map((cantiere) => (
          <CantiereCard key={cantiere.id} {...cantiere} />
        ))}
      </section>
    </div>
  );
}
