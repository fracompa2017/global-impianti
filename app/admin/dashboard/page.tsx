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
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] text-[#0A0C14]">Dashboard</h1>
          <p className="text-sm text-[#4A5068]">
          Panoramica operativa cantieri, team e report giornalieri
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Esporta KPI</Button>
          <Button>Nuova azione</Button>
        </div>
      </header>
      <div className="gi-divider" />

      <KpiCards kpi={data.kpi} />

      <section className="grid gap-6 xl:grid-cols-2">
        <CantieriOverviewList items={data.cantieriInCorso} />
        <RecentReportsFeed reports={data.recentReports as any} />
      </section>

      <WeeklyShiftsChart turni={data.turniSettimanali} />
    </div>
  );
}
