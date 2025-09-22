import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { QuizManagementTable } from "@/components/quiz-management-table";
import { SectionCards } from "@/components/section-cards";
import { getQuizzesServer } from "@/lib/actions/questions";

export default async function Page() {
  const quizzes = await getQuizzesServer();

  // Note: This is server component, so we can't use client-side hooks directly
  // The KPI data will be fetched on the client side in SectionCards component

  return (
    <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <QuizManagementTable initialData={quizzes} />
            </div>
          </div>
    </div>    
  );
}
