// Server Component: admin quiz dashboard
import { QuizManagementTable } from "@/components/quiz-management-table"
import { getQuizzesServer, type Quiz } from "@/lib/actions/questions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconQuestionMark, IconPhoto, IconUsers, IconTarget } from "@tabler/icons-react"

export default async function QuizManagementPage() {
  const quizData: Quiz[] = await getQuizzesServer()
  const totalQuestions = quizData.length
  const activeQuestions = quizData.filter((q: Quiz) => q.is_active).length
  const questionsWithImages = quizData.filter((q: Quiz) => q.image_url).length
  const totalAnswers = quizData.reduce((sum: number, q: Quiz) => sum + q.answer_count, 0)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">จัดการคำถามแบบทดสอบ</h1>
        <p className="text-muted-foreground">
          จัดการคำถาม ตัวเลือกคำตอบ หมวดหมู่ KPI และรูปภาพประกอบสำหรับแบบทดสอบความรู้เรื่องการหลอกลวง
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำถามทั้งหมด</CardTitle>
            <IconQuestionMark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-1">
                {activeQuestions}
              </Badge>
              เปิดใช้งาน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รูปภาพประกอบ</CardTitle>
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionsWithImages}</div>
            <p className="text-xs text-muted-foreground">จาก {totalQuestions} คำถาม</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ตัวเลือกทั้งหมด</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnswers}</div>
            <p className="text-xs text-muted-foreground">
              เฉลี่ย {totalQuestions > 0 ? (totalAnswers / totalQuestions).toFixed(1) : 0} ต่อคำถาม
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หมวดหมู่ KPI</CardTitle>
            <IconTarget className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">หมวดหมู่หลัก</p>
          </CardContent>
        </Card>
      </div>

      {/* Image Manager placeholder (module not yet implemented) */}
      <Card>
        <CardHeader>
          <CardTitle>รูปภาพประกอบ (Global Storage)</CardTitle>
          <CardDescription>
            ฟีเจอร์จัดการรูปภาพรวมกำลังพัฒนา โปรดใช้การอัปโหลดรูปภาพในหน้ารายการคำถามแต่ละข้อชั่วคราว
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Quiz Management Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำถาม</CardTitle>
          <CardDescription>จัดการคำถาม ลำดับ หมวดหมู่ และตัวเลือกคำตอบ พร้อมฟีเจอร์ลากและวางเพื่อจัดเรียงลำดับ</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <QuizManagementTable initialData={quizData} />
        </CardContent>
      </Card>
    </div>
  )
}
