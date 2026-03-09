import { CantieriOverviewList } from "@/components/admin/cantieri-overview-list";
import { KpiCards } from "@/components/admin/kpi-cards";
import { RecentReportsFeed } from "@/components/admin/recent-reports-feed";
import { WeeklyShiftsChart } from "@/components/admin/weekly-shifts-chart";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData } from "@/lib/supabase/queries";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div
        className="relative overflow-hidden rounded-[24px] px-6 py-6 text-white"
        style={{
          background: "linear-gradient(160deg,#0C1A3A 0%,#142448 60%,#1C3060 100%)",
          boxShadow: "0 8px 32px rgba(12,26,58,0.22)",
        }}
      >
        {/* blob */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle,#4A78F5,transparent)" }} />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Panoramica generale
            </p>
            <h1 className="mt-1 text-[1.75rem] font-extrabold tracking-[-0.035em]">
              Dashboard
            </h1>
            <p className="mt-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
              Cantieri, team e report giornalieri in tempo reale
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm"
              className="!rounded-[12px] !text-white hover:!bg-white/15 !border-white/20"
              style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)" }}>
              Esporta KPI
            </Button>
            <Button size="sm" className="!rounded-[12px]"
              style={{ background: "white", color: "#2B5CE6", boxShadow: "0 4px 14px rgba(255,255,255,0.25)" }}>
              Nuova azione
            </Button>
          </div>
        </div>
      </div>

      <KpiCards kpi={data.kpi} />

      <section className="grid gap-6 xl:grid-cols-2">
        <CantieriOverviewList items={data.cantieriInCorso} />
        <RecentReportsFeed reports={data.recentReports as any} />
      </section>

      <WeeklyShiftsChart turni={data.turniSettimanali} />
    </div>
  );
}
