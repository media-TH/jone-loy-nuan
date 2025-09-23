import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { UserStatisticsTable } from "@/components/user-statistics-table";
import { getVisitorAnalytics } from "@/lib/actions/user-statistics";

export default async function Page() {  
  const analytics = await getVisitorAnalytics();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
            <p className="text-muted-foreground">ภาพรวมของระบบจัดการ Quiz</p>
          </div>
        </div>
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive analytics={analytics} />
        </div>
        <div className="px-4 lg:px-6">
          <UserStatisticsTable />
        </div>
      </div>
    </div>
  );
}
