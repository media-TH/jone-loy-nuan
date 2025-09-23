import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { UserStatisticsTable } from "@/components/user-statistics-table";
import { getQuizzesServer } from "@/lib/actions/questions";

export default async function Page() {
  const quizzes = await getQuizzesServer();

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
          <ChartAreaInteractive />
        </div>
        <div className="px-4 lg:px-6">
          <UserStatisticsTable />
        </div>
      </div>
    </div>
  );
}
