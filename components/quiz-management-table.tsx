"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconPhoto,
  IconEye,
  IconEdit,
  IconTrash,
  IconCopy,
  IconRefresh,
} from "@tabler/icons-react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { type Quiz, updateQuizOrderAction, updateQuizAction, deleteQuizAction } from "@/lib/actions/questions"
import { type KPICategory } from "@/lib/types"
import { toast } from "sonner"
import Link from "next/link"

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const getKpiColor = (category: string) => {
  switch (category) {
    case "SCAM_RECOGNITION":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "RISK_ASSESSMENT":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "PROTECTIVE_ACTIONS":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    case "RESPONSE_STRATEGIES":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}

const KPI_CATEGORIES: Record<string, string> = {
  SCAM_RECOGNITION: "การจำแนกกลโกง",
  RISK_ASSESSMENT: "การประเมินความเสี่ยง",
  PROTECTIVE_ACTIONS: "การป้องกัน",
  RESPONSE_STRATEGIES: "การรับมือ",
}

function createColumns(handleDeleteQuiz: (id: string) => void): ColumnDef<Quiz>[] {
  return [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => <DragHandle id={row.original.id} />,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "question_text",
      header: "คำถาม",
      cell: ({ row }) => {
        return <QuizCellViewer item={row.original} onUpdate={() => {}} />
      },
      enableHiding: false,
    },
    {
      accessorKey: "kpi_category",
      header: "หมวดหมู่ KPI",
      cell: ({ row }) => (
        <div className="w-40">
          <Badge variant="outline" className={`px-2 py-1 text-xs ${getKpiColor(row.original.kpi_category || "")}`}>
            {KPI_CATEGORIES[(row.original.kpi_category || "SCAM_RECOGNITION") as keyof typeof KPI_CATEGORIES]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "order_index",
      header: () => <div className="w-full text-center">ลำดับ</div>,
      cell: ({ row }) => <div className="text-center font-mono text-sm">{row.original.order_index}</div>,
    },
    {
      accessorKey: "answer_count",
      header: () => <div className="w-full text-center">จำนวนตัวเลือก</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="secondary" className="px-2 py-1">
            {row.original.answer_count} ตัวเลือก
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "image_url",
      header: "รูปภาพ",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {row.original.image_url ? (
            <IconPhoto className="size-4 text-green-600" />
          ) : (
            <IconPhoto className="size-4 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "สถานะ",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/quiz?preview=${row.original.id}`}>
                <IconEye className="mr-2 size-4" />
                ดูรายละเอียด
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/mgmt-portal/quizzes/${row.original.id}/edit`}>
                <IconEdit className="mr-2 size-4" />
                แก้ไข
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <IconCopy className="mr-2 size-4" />
              ทำสำเนา
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteQuiz(row.original.id)}>
              <IconTrash className="mr-2 size-4" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

function DraggableRow({ row }: { row: Row<Quiz> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

export function QuizManagementTable({ initialData = [] as Quiz[] }: { initialData?: Quiz[] }) {
  const [data, setData] = React.useState<Quiz[]>(initialData)
  const [isLoading, setIsLoading] = React.useState(initialData.length === 0)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isUpdating, setIsUpdating] = React.useState(false)
  // using sonner's toast directly

  const sortableId = React.useId()
  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data])

  const fetchQuizzes = React.useCallback(async () => {
    // We currently rely on server-provided initialData; implement client refetch later if needed.
    setIsLoading(false)
  }, [])

  const handleDeleteQuiz = React.useCallback(
    async (id: string) => {
      setIsUpdating(true)
      try {
        await deleteQuizAction(id)
        setData((prev) => prev.filter((quiz) => quiz.id !== id))
        toast.success("ลบคำถามสำเร็จ - คำถามได้รับการลบแล้ว")
      } catch (error) {
        console.error("Failed to delete quiz:", error)
        toast.error("เกิดข้อผิดพลาด - ไม่สามารถลบคำถามได้")
      } finally {
        setIsUpdating(false)
      }
    },
    [],
  )

  const columns = React.useMemo(() => createColumns(handleDeleteQuiz), [handleDeleteQuiz])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      const newData = [...data]
      const oldIndex = dataIds.indexOf(active.id)
      const newIndex = dataIds.indexOf(over.id)
      const reorderedData = arrayMove(newData, oldIndex, newIndex)

      const updatedData = reorderedData.map((item, index) => ({
        ...item,
        order_index: index + 1,
      }))

      setData(updatedData)
      setIsUpdating(true)

      try {
        await updateQuizOrderAction(updatedData.map(({ id }) => ({ id })))
        toast.success("อัปเดตลำดับสำเร็จ - ลำดับคำถามได้รับการอัปเดตแล้ว")
      } catch (error) {
        console.error("Failed to update order:", error)
        setData(data)
        toast.error("เกิดข้อผิดพลาด - ไม่สามารถอัปเดตลำดับได้")
      } finally {
        setIsUpdating(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="w-full flex-col justify-start gap-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">กำลังโหลดข้อมูลคำถาม...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      {isUpdating && (
        <div className="fixed top-4 right-4 z-50 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg">
          กำลังอัปเดต...
        </div>
      )}

      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Input
            placeholder="ค้นหาคำถาม..."
            value={(table.getColumn("question_text")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("question_text")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn("kpi_category")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => table.getColumn("kpi_category")?.setFilterValue(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="เลือกหมวดหมู่ KPI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
              {Object.entries(KPI_CATEGORIES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchQuizzes} variant="outline" size="sm" disabled={isLoading}>
            <IconRefresh className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden lg:inline">รีเฟรช</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">จัดการคอลัมน์</span>
                <span className="lg:hidden">คอลัมน์</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">เพิ่มคำถามใหม่</span>
          </Button>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {isLoading ? "กำลังโหลดข้อมูล..." : "ไม่พบข้อมูลคำถาม"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            เลือกแล้ว {table.getFilteredSelectedRowModel().rows.length} จาก {table.getFilteredRowModel().rows.length}{" "}
            รายการ
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                แสดงต่อหน้า
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              หน้า {table.getState().pagination.pageIndex + 1} จาก {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex bg-transparent"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 bg-transparent"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8 bg-transparent"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex bg-transparent"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuizCellViewer({
  item,
  onUpdate,
}: {
  item: Quiz
  onUpdate?: (updatedQuiz: Quiz) => void
}) {
  const isMobile = useIsMobile()
  const [isUpdating, setIsUpdating] = React.useState(false)
  

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setIsUpdating(true)
    try {
      const updatedQuiz = {
        ...item,
        question_text: formData.get("question") as string,
        kpi_category: formData.get("kpi_category") as KPICategory,
        order_index: Number.parseInt(formData.get("order") as string),
        is_active: formData.get("status") === "active",
      }

      await updateQuizAction(updatedQuiz)

      if (onUpdate) {
        onUpdate(updatedQuiz as Quiz)
      }

      toast.success("อัปเดตคำถามสำเร็จ - ข้อมูลคำถามได้รับการอัปเดตแล้ว")
    } catch (error) {
      console.error("Failed to update quiz:", error)
      toast.error("เกิดข้อผิดพลาด - ไม่สามารถอัปเดตคำถามได้")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left h-auto whitespace-normal">
          <div className="max-w-md truncate">{item.question_text}</div>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader className="gap-1">
          <DrawerTitle>จัดการคำถาม</DrawerTitle>
          <DrawerDescription>แก้ไขคำถาม ตัวเลือก และการตั้งค่าต่างๆ</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm max-h-[70vh]">
          <form id="quiz-edit-form" onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="question">คำถาม</Label>
              <Textarea
                name="question"
                id="question"
                defaultValue={item.question_text}
                className="min-h-20"
                placeholder="กรอกคำถาม..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="kpi-category">หมวดหมู่ KPI</Label>
                <Select name="kpi_category" defaultValue={item.kpi_category ?? undefined}>
                  <SelectTrigger id="kpi-category" className="w-full">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KPI_CATEGORIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="order">ลำดับ</Label>
                <Input name="order" id="order" type="number" defaultValue={item.order_index ?? undefined} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">สถานะ</Label>
                <Select name="status" defaultValue={item.is_active ? "active" : "inactive"}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">เปิดใช้งาน</SelectItem>
                    <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="image">รูปภาพประกอบ</Label>
              <div className="flex items-center gap-2">
                <Input id="image" defaultValue={item.image_url || ""} placeholder="URL รูปภาพ หรือ คลิกเพื่ออัปโหลด" />
                <Button type="button" variant="outline" size="sm">
                  <IconPhoto className="size-4" />
                  อัปโหลด
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>ตัวเลือกคำตอบ</Label>
                <Button type="button" variant="outline" size="sm">
                  <IconPlus className="size-4 mr-1" />
                  เพิ่มตัวเลือก
                </Button>
              </div>
              <div className="space-y-3">
                {(item.answers ?? []).map((ans: { id: string; answer_text: string; is_correct: boolean }, i: number) => (
                  <div key={ans.id ?? i} className="flex items-center gap-2 p-3 border rounded-lg">
                    <Checkbox id={`answer-${i}`} defaultChecked={!!ans.is_correct} />
                    <Input defaultValue={ans.answer_text} placeholder={`ตัวเลือกที่ ${i + 1}`} className="flex-1" />
                    <Button type="button" variant="ghost" size="sm">
                      <IconTrash className="size-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {(!item.answers || item.answers.length === 0) && (
                  <div className="text-muted-foreground text-sm">ยังไม่มีตัวเลือกคำตอบ</div>
                )}
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button type="submit" form="quiz-edit-form" disabled={isUpdating} aria-label="บันทึกการเปลี่ยนแปลง">
            {isUpdating ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" aria-label="ยกเลิก">ยกเลิก</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
