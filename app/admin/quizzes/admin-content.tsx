"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
	ArrowUpDown,
	MoreHorizontal,
	Search,
	Eye,
	RefreshCw,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteQuestionAction } from "@/lib/actions/questions";
import type { QuestionWithAnswers } from "@/lib/types";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Cell Action Component
const CellAction = ({
	questionId,
	onDeleteSuccess,
}: {
	questionId: string;
	onDeleteSuccess: () => void;
}) => {
	const [isPending, startTransition] = useTransition();

	const handleDelete = () => {
		if (confirm("คุณแน่ใจหรือไม่ที่จะลบคำถามนี้?")) {
			startTransition(async () => {
				const result = await deleteQuestionAction(questionId);
				if (result.success) {
					toast.success("ลบคำถามเรียบร้อยแล้ว!");
					onDeleteSuccess(); // Refresh data after delete
				} else {
					toast.error(result.error || "ไม่สามารถลบคำถามได้");
				}
			});
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">เปิดเมนู</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
				<DropdownMenuItem asChild>
					<Link href={`/quiz?preview=${questionId}`}>
						<Eye className="mr-2 h-4 w-4" />
						ดูตัวอย่าง
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href={`/admin/quizzes/${questionId}/edit`}>แก้ไขคำถาม</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href={`/admin/quizzes/${questionId}/images`}>จัดการรูปภาพ</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={handleDelete}
					disabled={isPending}
					className="text-red-600 focus:text-red-600"
				>
					ลบคำถาม
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default function AdminContent() {
	const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get("query") || "";

	const fetchQuestions = useCallback(async () => {
		const supabase = createClient();

		try {
			// ใช้ RPC function เพื่อดึงข้อมูลพร้อม answers
			const { data, error } = await supabase.rpc("get_questions_with_answers");

			if (error) {
				toast.error("ไม่สามารถโหลดคำถามได้");
				console.error(error);
				setQuestions([]);
				return;
			}

			// Filter ถ้ามี query
			let filteredData = data || [];
			if (query) {
				filteredData = filteredData.filter((q: any) =>
					q.question_text?.toLowerCase().includes(query.toLowerCase())
				);
			}

			// Sort by order_index
			filteredData.sort(
				(a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
			);

			setQuestions(filteredData);
		} catch (error) {
			console.error("Error fetching questions:", error);
			toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [query]);

	useEffect(() => {
		fetchQuestions();
	}, [fetchQuestions]);

	// Handle search form submission
	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const searchQuery = formData.get("query") as string;
		router.push(`/admin/quizzes?query=${searchQuery}`);
	};

	// Handle refresh
	const handleRefresh = () => {
		setIsRefreshing(true);
		fetchQuestions();
		toast.success("รีเฟรชข้อมูลเรียบร้อย");
	};

	// Columns definition with onDeleteSuccess
	const columns: ColumnDef<QuestionWithAnswers>[] = [
		{
			accessorKey: "order_index",
			header: "#",
			cell: ({ row }) => (
				<div className="w-12 text-center font-mono text-sm">
					{row.original.order_index}
				</div>
			),
		},
		{
			accessorKey: "question_text",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					คำถาม
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => {
				const text = row.original.question_text;
				return (
					<div className="max-w-md" title={text}>
						<div className="font-medium line-clamp-2">
							{text.length > 100 ? `${text.substring(0, 100)}...` : text}
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "category",
			header: "หมวดหมู่",
			cell: ({ row }) => {
				const category = row.original.category;
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
						{category || "ไม่มีหมวดหมู่"}
					</span>
				);
			},
		},
		{
			accessorKey: "answers",
			header: "คำตอบ",
			cell: ({ row }) => {
				const answers = row.original.answers;
				const answerCount = Array.isArray(answers) ? answers.length : 0;
				const correctAnswers = Array.isArray(answers)
					? answers.filter((a: any) => a.isCorrect || a.is_correct).length
					: 0;

				return (
					<div className="flex items-center gap-2">
						<span className="text-sm font-mono">{answerCount} ข้อ</span>
						{correctAnswers >= 1 ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 cursor-help">
										ถูก {correctAnswers} ข้อ
									</span>
								</TooltipTrigger>
								<TooltipContent sideOffset={6} className="max-w-sm text-left">
									<div className="text-xs font-medium mb-1">คำตอบที่ถูก</div>
									<ul className="list-disc pl-4 space-y-0.5">
										{(Array.isArray(answers) ? answers : [])
											.filter((a: any) => a.isCorrect || a.is_correct)
											.map((a: any, idx: number) => (
												<li key={idx} className="text-xs leading-snug">
													{a.text || a.answer_text || "(ไม่มีข้อความ)"}
												</li>
											))}
									</ul>
								</TooltipContent>
							</Tooltip>
						) : (
							<span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
								ไม่มีคำตอบถูก
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "created_at",
			header: "สร้างเมื่อ",
			cell: ({ row }) => {
				const date = new Date(row.original.created_at);
				return (
					<div className="text-sm text-gray-500">
						{date.toLocaleDateString("th-TH")}
					</div>
				);
			},
		},
		{
			id: "actions",
			header: "การจัดการ",
			cell: ({ row }) => (
				<CellAction
					questionId={row.original.id}
					onDeleteSuccess={fetchQuestions}
				/>
			),
		},
	];

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">จัดการคำถาม Quiz</h1>
					<p className="text-gray-600">
						จัดการคำถาม คำตอบ และเนื้อหา Quiz ความตระหนักเรื่องการหลอกลวงออนไลน์
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={handleRefresh}
						variant="outline"
						disabled={isRefreshing}
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
						/>
						รีเฟรช
					</Button>
					<Button asChild>
						<Link href="/admin/quizzes/new">เพิ่มคำถาม</Link>
					</Button>
				</div>
			</div>

			{/* Search Section */}
			<div className="flex items-center space-x-4">
				<form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						name="query"
						placeholder="ค้นหาคำถาม..."
						defaultValue={query}
						className="pl-9"
					/>
				</form>
			</div>

			{/* Data Table Section */}
			<div className="bg-white border rounded-lg">
				{isLoading ? (
					<div className="text-center py-8 text-gray-500">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
						<p className="mt-2">กำลังโหลดข้อมูล...</p>
					</div>
				) : (
					<DataTable columns={columns} data={questions} />
				)}
			</div>
		</div>
	);
}
