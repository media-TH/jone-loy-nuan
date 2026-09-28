import type { Database } from "@/lib/database.types";
import {
	LEGACY_PIN_RED_FLAG,
	LEGACY_PIN_SCENARIO,
	legacyRowToQuestion,
	legacyRowsToQuestions,
	type LegacyQuestionRow,
} from "@/lib/content/legacy";
import { questionSchema } from "@/lib/content/schema";

type RpcRow = Database["public"]["Functions"]["get_questions_with_answers"]["Returns"][number];

/** A row exactly as get_questions_with_answers() returns it today. */
function rpcRow(order: number, overrides: Partial<RpcRow> = {}): RpcRow {
	return {
		id: `question-${order}`,
		order_index: order,
		question_text: `คำถามข้อ ${order}`,
		category: "แก๊งคอลเซ็นเตอร์",
		kpi_category: "RISK_ASSESSMENT",
		content: {},
		result: {
			correctTitle: "ถูกต้อง",
			wrongTitle: "ยังไม่ถูก",
			header: "หัวข้อ",
			explanation: "คำอธิบาย",
		},
		answers: [
			{ id: `a${order}-1`, answer_text: "ตัวเลือกที่ปลอดภัย", is_correct: true, explanation: null },
			{ id: `a${order}-2`, answer_text: "ตัวเลือกที่เสี่ยง", is_correct: false, explanation: null },
		],
		created_at: "2025-01-01T00:00:00Z",
		updated_at: "2025-01-01T00:00:00Z",
		...overrides,
	};
}

describe("legacyRowToQuestion", () => {
	it("accepts the generated RPC row type", () => {
		const row: LegacyQuestionRow = rpcRow(2);
		expect(legacyRowToQuestion(row).id).toBe("question-2");
	});

	it("maps order_index 1 to the PIN screen with the overlay's red flag", () => {
		const question = legacyRowToQuestion(rpcRow(1));

		expect(question.scenario).toEqual(LEGACY_PIN_SCENARIO);
		expect(question.scenario).toEqual({ kind: "pin-entry", pinLength: 6, prompt: "กรุณากรอกรหัสผ่าน" });
		expect(question.redFlags).toEqual([LEGACY_PIN_RED_FLAG]);
		expect(question.redFlags[0]).toEqual({
			number: 1,
			label: "ห้ามกรอกรหัสที่คุณใช้จริงเด็ดขาด!",
			detail: "แบบทดสอบนี้ไม่มีการจัดเก็บรหัสผ่านของผู้ใช้",
		});
	});

	it("ignores content.images on the PIN question, as the quiz always did", () => {
		const question = legacyRowToQuestion(
			rpcRow(1, { content: { images: { normal: "/a.svg", result: "/b.svg" } } }),
		);
		expect(question.scenario.kind).toBe("pin-entry");
	});

	it("derives the image pair from order_index when content has no images", () => {
		const question = legacyRowToQuestion(rpcRow(7));

		expect(question.scenario).toEqual({
			kind: "image-pair",
			normalSrc: "/images/scenarios/question-7/normal.svg",
			resultSrc: "/images/scenarios/question-7/result.svg",
			alt: "ภาพสถานการณ์จำลองข้อ 7",
		});
		expect(question.redFlags).toEqual([]);
	});

	it("uses content.images and content.alt when present, per image", () => {
		const question = legacyRowToQuestion(
			rpcRow(3, {
				content: {
					images: { normal: "https://example.supabase.co/storage/v1/object/public/q3/normal.png" },
					alt: "โฆษณาเงินกู้",
				},
			}),
		);

		expect(question.scenario).toEqual({
			kind: "image-pair",
			normalSrc: "https://example.supabase.co/storage/v1/object/public/q3/normal.png",
			resultSrc: "/images/scenarios/question-3/result.svg",
			alt: "โฆษณาเงินกู้",
		});
	});

	it("treats blank image URLs as missing", () => {
		const question = legacyRowToQuestion(rpcRow(4, { content: { images: { normal: " ", result: "" } } }));
		expect(question.scenario).toMatchObject({
			normalSrc: "/images/scenarios/question-4/normal.svg",
			resultSrc: "/images/scenarios/question-4/result.svg",
		});
	});

	it("maps the other fields", () => {
		expect(legacyRowToQuestion(rpcRow(2))).toEqual({
			id: "question-2",
			order: 2,
			prompt: "คำถามข้อ 2",
			category: "แก๊งคอลเซ็นเตอร์",
			kpiCategory: "RISK_ASSESSMENT",
			scenario: expect.objectContaining({ kind: "image-pair" }),
			answers: [
				{ id: "a2-1", text: "ตัวเลือกที่ปลอดภัย", isCorrect: true },
				{ id: "a2-2", text: "ตัวเลือกที่เสี่ยง", isCorrect: false },
			],
			result: {
				correctTitle: "ถูกต้อง",
				wrongTitle: "ยังไม่ถูก",
				header: "หัวข้อ",
				explanation: "คำอธิบาย",
			},
			redFlags: [],
		});
	});

	it("reads answers in the transformed shape and JSON-encoded, and skips broken entries", () => {
		const transformed = legacyRowToQuestion(
			rpcRow(2, {
				answers: [
					{ id: "x", text: "ใช่", isCorrect: true },
					{ id: "y", text: "ไม่", isCorrect: false },
					{ text: "ไม่มี id", isCorrect: false },
					{ id: "z", answer_text: "  ", is_correct: true },
				],
			}),
		);
		expect(transformed.answers).toEqual([
			{ id: "x", text: "ใช่", isCorrect: true },
			{ id: "y", text: "ไม่", isCorrect: false },
		]);

		const encoded = legacyRowToQuestion(
			rpcRow(2, { answers: JSON.stringify([{ id: "x", answer_text: "ใช่", is_correct: true }]) }),
		);
		expect(encoded.answers).toEqual([{ id: "x", text: "ใช่", isCorrect: true }]);
	});

	it("falls back to SCAM_RECOGNITION like the quiz client did", () => {
		const row: LegacyQuestionRow = { ...rpcRow(2), kpi_category: undefined };
		expect(legacyRowToQuestion(row).kpiCategory).toBe("SCAM_RECOGNITION");
		expect(legacyRowToQuestion({ ...rpcRow(2), kpi_category: "NOT_A_KPI" }).kpiCategory).toBe(
			"SCAM_RECOGNITION",
		);
	});

	it("fills missing result copy and category with empty strings", () => {
		const question = legacyRowToQuestion({ ...rpcRow(2), result: null, category: null });
		expect(question.result).toEqual({ correctTitle: "", wrongTitle: "", header: "", explanation: "" });
		expect(question.category).toBe("");
	});

	it("lets a stored scenario win over the order-based mapping", () => {
		const pinAnywhere = legacyRowToQuestion({
			...rpcRow(4),
			scenario: { kind: "pin-entry", pinLength: 4, prompt: "ใส่รหัส" },
		});
		expect(pinAnywhere.scenario).toEqual({ kind: "pin-entry", pinLength: 4, prompt: "ใส่รหัส" });

		const imageFirst = legacyRowToQuestion({
			...rpcRow(1),
			scenario: { kind: "image-pair", normalSrc: "/n.svg", resultSrc: "/r.svg", alt: "ภาพ" },
		});
		expect(imageFirst.scenario.kind).toBe("image-pair");
	});

	it("keeps the legacy mapping when the stored scenario is invalid", () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
		const question = legacyRowToQuestion({ ...rpcRow(1), scenario: { kind: "hologram" } });
		expect(question.scenario).toEqual(LEGACY_PIN_SCENARIO);
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});

	it("prefers red flags from the red_flags table, sorted, accepting the old flag_text column", () => {
		const question = legacyRowToQuestion({
			...rpcRow(1),
			red_flags: [
				{ number: 2, label: "ลิงก์แปลก", detail: null, x: 40, y: 55.5 },
				{ number: 1, label: null, flag_text: "ขอรหัส PIN", detail: "ธนาคารไม่ขอรหัสผ่านลิงก์", x: null, y: null },
				{ number: 3, label: "   " },
			],
		});

		expect(question.redFlags).toEqual([
			{ number: 1, label: "ขอรหัส PIN", detail: "ธนาคารไม่ขอรหัสผ่านลิงก์" },
			{ number: 2, label: "ลิงก์แปลก", x: 40, y: 55.5 },
		]);
	});

	it("keeps the overlay flag when the red_flags list is empty", () => {
		expect(legacyRowToQuestion({ ...rpcRow(1), red_flags: [] }).redFlags).toEqual([LEGACY_PIN_RED_FLAG]);
	});

	it("produces questions that pass the content schema", () => {
		for (const order of [1, 2, 10]) {
			expect(questionSchema.safeParse(legacyRowToQuestion(rpcRow(order))).success).toBe(true);
		}
	});

	it("returns copies, so callers cannot change the shared legacy constants", () => {
		const question = legacyRowToQuestion(rpcRow(1));
		question.redFlags[0].label = "changed";
		(question.scenario as { prompt: string }).prompt = "changed";
		expect(LEGACY_PIN_RED_FLAG.label).toBe("ห้ามกรอกรหัสที่คุณใช้จริงเด็ดขาด!");
		expect(LEGACY_PIN_SCENARIO.prompt).toBe("กรุณากรอกรหัสผ่าน");
	});
});

describe("legacyRowsToQuestions", () => {
	it("sorts by order_index like fetchQuizQuestions", () => {
		const questions = legacyRowsToQuestions([rpcRow(3), rpcRow(1), rpcRow(2)]);
		expect(questions.map((question) => question.order)).toEqual([1, 2, 3]);
	});
});
