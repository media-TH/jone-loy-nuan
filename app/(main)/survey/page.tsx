"use client";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useActionState, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { submitSurveyAction } from "@/lib/actions/survey";
import { useQuizResultStore } from "@/store/quiz-store";
import { useQuizAnimations } from "@/hooks/useQuizAnimations";
import {
	Loader2,
	User,
	GraduationCap,
	Briefcase,
	CheckCircle,
	Send,
	SkipForward,
} from "lucide-react";

const FORM_DATA = {
	ageGroups: [
		{ value: "under18", label: "ต่ำกว่า 18 ปี" },
		{ value: "18-24", label: "18-24 ปี" },
		{ value: "25-34", label: "25-34 ปี" },
		{ value: "35-44", label: "35-44 ปี" },
		{ value: "45-54", label: "45-54 ปี" },
		{ value: "55-64", label: "55-64 ปี" },
		{ value: "65+", label: "65 ปีขึ้นไป" },
	],
	educationLevels: [
		{ value: "none", label: "ไม่มีวุฒิการศึกษา" },
		{ value: "primary", label: "ประถมศึกษา" },
		{ value: "secondary", label: "มัธยมศึกษา" },
		{ value: "vocational", label: "ปวช./ปวส." },
		{ value: "bachelor", label: "ปริญญาตรี" },
		{ value: "master", label: "ปริญญาโท" },
		{ value: "doctorate", label: "ปริญญาเอก" },
	],
	occupations: [
		{ value: "student", label: "นักเรียน/นักศึกษา" },
		{ value: "government", label: "ข้าราชการ/พนักงานรัฐวิสาหกิจ" },
		{ value: "private", label: "พนักงานบริษัทเอกชน" },
		{ value: "business", label: "ธุรกิจส่วนตัว/ค้าขาย" },
		{ value: "freelance", label: "อาชีพอิสระ/ฟรีแลนซ์" },
		{ value: "labor", label: "รับจ้างทั่วไป" },
		{ value: "agriculture", label: "เกษตรกร" },
		{ value: "retired", label: "เกษียณอายุ" },
		{ value: "unemployed", label: "ว่างงาน" },
		{ value: "other", label: "อื่นๆ" },
	],
};

const initialState = { success: false, message: "" };

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<motion.button
			type="submit"
			disabled={pending}
			className="group relative w-full overflow-hidden rounded-xl bg-blue-600 p-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none"
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.4, duration: 0.4 }}
		>
			<div className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-white transition-all duration-300 group-hover:bg-blue-700 group-disabled:bg-gray-400">
				{pending ? (
					<>
						<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						<span className="text-lg font-semibold">กำลังส่งข้อมูล...</span>
					</>
				) : (
					<>
						<Send className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
						<span className="text-lg font-semibold">ส่งแบบสอบถาม</span>
					</>
				)}
			</div>
		</motion.button>
	);
}

function FormField({
	id,
	label,
	name,
	options,
	icon: Icon,
	placeholder,
	index = 0,
}: {
	id: string;
	label: string;
	name: string;
	options: { value: string; label: string }[];
	icon: React.ComponentType<{ className?: string }>;
	placeholder: string;
	index?: number;
}) {
	const [isSelected, setIsSelected] = useState(false);
	const [selectedValue, setSelectedValue] = useState("");

	const getStatusIcon = () => {
		if (isSelected && selectedValue) {
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		}
		return <Icon className="h-4 w-4" />;
	};

	return (
		<motion.div
			className="group space-y-3"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.1, duration: 0.4 }}
		>
			<motion.label
				htmlFor={id}
				className="flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-blue-600"
				animate={isSelected && selectedValue ? { color: "#059669" } : {}}
				transition={{ duration: 0.3 }}
			>
				<motion.span
					initial={false}
					animate={{ scale: isSelected && selectedValue ? 1.1 : 1 }}
					transition={{ duration: 0.2 }}
				>
					{getStatusIcon()}
				</motion.span>
				{label}
				<span className="text-red-500">*</span>
			</motion.label>
			<div className="relative">
				<select
					name={name}
					id={id}
					required
					className={`w-full appearance-none rounded-xl border px-4 py-3 text-gray-700 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 hover:shadow-md ${
						isSelected && selectedValue
							? "border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500/20"
							: "border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-300"
					}`}
					onChange={(e) => {
						setSelectedValue(e.target.value);
						setIsSelected(e.target.value !== "");
					}}
				>
					<option value="" className="text-gray-400">
						{placeholder}
					</option>
					{options.map((option) => (
						<option
							key={option.value}
							value={option.value}
							className="text-gray-700"
						>
							{option.label}
						</option>
					))}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
					<svg
						className={`h-4 w-4 transition-colors ${
							isSelected && selectedValue
								? "text-green-500"
								: "text-gray-400 group-focus-within:text-blue-600"
						}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</div>
			</div>
		</motion.div>
	);
}

function SkipButton({ onClick }: { onClick: () => void }) {
	return (
		<motion.button
			type="button"
			onClick={onClick}
			className="group relative w-full overflow-hidden rounded-xl border-2 border-gray-300 bg-white p-3 transition-all duration-300 hover:scale-[1.02] hover:border-gray-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5, duration: 0.4 }}
		>
			<div className="flex h-12 w-full items-center justify-center rounded-xl text-gray-700 transition-all duration-300 group-hover:text-gray-900">
				<SkipForward className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
				<span className="text-lg font-semibold">ข้าม</span>
			</div>
		</motion.button>
	);
}

export default function SurveyPage() {
	const router = useRouter();
	const { getSummary } = useQuizResultStore();
	const { score, total } = getSummary();
	const [state, formAction] = useActionState(submitSurveyAction, initialState);
	const { getLandingPageAnimation } = useQuizAnimations(false);

	const handleSkip = () => {
		toast.info("ข้ามการกรอกข้อมูล", {
			duration: 2000,
			style: {
				background: "linear-gradient(to right, #0ea5e9, #3b82f6)",
				color: "white",
				border: "none",
			},
		});
		router.push("/result");
	};

	useEffect(() => {
		if (state.success) {
			toast.success(state.message, {
				duration: 3000,
				style: {
					background: "linear-gradient(to right, #059669, #10b981)",
					color: "white",
					border: "none",
				},
			});
			router.push("/result");
		} else if (state.message && !state.success) {
			toast.error(state.message, {
				duration: 4000,
				style: {
					background: "linear-gradient(to right, #dc2626, #ef4444)",
					color: "white",
					border: "none",
				},
			});
		}
	}, [state, router]);

	return (
		<motion.div
			className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-4 px-4 md:py-8"
			{...getLandingPageAnimation().container}
		>
			<div className="w-full max-w-2xl">
				{/* Header */}
				<motion.div
					className="mb-6 md:mb-8 text-center"
					{...getLandingPageAnimation().title}
				>
					<h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
						กรอกข้อมูลเพื่อดูผลทดสอบ
					</h1>
				</motion.div>

				{/* Form */}
				<motion.form
					action={formAction}
					className="space-y-6 md:space-y-8 rounded-2xl border border-white/20 bg-white/80 p-6 md:p-8 shadow-xl backdrop-blur-sm"
					{...getLandingPageAnimation().card}
				>
					<input type="hidden" name="totalScore" value={score || 0} />
					<input type="hidden" name="totalQuestions" value={total || 10} />

					<FormField
						id="ageGroup"
						label="ช่วงอายุ"
						name="ageGroup"
						options={FORM_DATA.ageGroups}
						icon={User}
						placeholder="เลือกช่วงอายุของคุณ"
						index={0}
					/>

					<FormField
						id="education"
						label="ระดับการศึกษา"
						name="education"
						options={FORM_DATA.educationLevels}
						icon={GraduationCap}
						placeholder="เลือกระดับการศึกษาของคุณ"
						index={1}
					/>

					<FormField
						id="occupation"
						label="อาชีพ"
						name="occupation"
						options={FORM_DATA.occupations}
						icon={Briefcase}
						placeholder="เลือกอาชีพของคุณ"
						index={2}
					/>

					<div className="pt-2 md:pt-4 space-y-3 md:space-y-4">
						<SubmitButton />
						<SkipButton onClick={handleSkip} />
					</div>
				</motion.form>
			</div>
		</motion.div>
	);
}
