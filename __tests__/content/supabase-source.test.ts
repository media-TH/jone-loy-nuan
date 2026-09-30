jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({
	unstable_cache: jest.fn((fn: () => unknown) => fn),
	revalidateTag: jest.fn(),
}));

import { revalidateTag, unstable_cache } from "next/cache";
import type { Database } from "@/lib/database.types";
import { LEGACY_QUIZ_META } from "@/lib/content/legacy";
import { ContentSourceError, DEFAULT_QUIZ_ID } from "@/lib/content/source";
import {
	QUIZ_QUESTION_LIMIT,
	SupabaseContentSource,
	revalidateQuizContent,
	type ContentDbClient,
} from "@/lib/content/supabase-source";

type RpcRow = Database["public"]["Functions"]["get_questions_with_answers"]["Returns"][number];
type Result = { data: unknown; error: { code?: string; message: string } | null };

interface FakeQuery {
	select(): FakeQuery;
	eq(): FakeQuery;
	order(): Promise<Result>;
	maybeSingle(): Promise<Result>;
}

function fakeClient(quizzes: Result, rows: Result) {
	const query: FakeQuery = {
		select: () => query,
		eq: () => query,
		order: async () => quizzes,
		maybeSingle: async () => quizzes,
	};
	const client = {
		from: jest.fn(() => query),
		rpc: jest.fn(async () => rows),
	};
	return { client, source: (cache = false) => new SupabaseContentSource({ client: () => client as unknown as ContentDbClient, cache }) };
}

function row(order: number, quizId?: string): RpcRow & { quiz_id?: string } {
	return {
		id: `question-${order}${quizId ? `-${quizId}` : ""}`,
		order_index: order,
		question_text: `คำถามข้อ ${order}`,
		category: "หมวด",
		kpi_category: "SCAM_RECOGNITION",
		content: {},
		result: {},
		answers: [
			{ id: `a${order}-1`, answer_text: "ปลอดภัย", is_correct: true },
			{ id: `a${order}-2`, answer_text: "เสี่ยง", is_correct: false },
		],
		created_at: "2025-01-01T00:00:00Z",
		updated_at: "2025-01-01T00:00:00Z",
		...(quizId ? { quiz_id: quizId } : {}),
	};
}

const missingTable: Result = {
	data: null,
	error: { code: "PGRST205", message: "Could not find the table 'public.quizzes' in the schema cache" },
};

describe("SupabaseContentSource", () => {
	it("serves the default quiz before the quizzes table exists, capped at 10 questions", async () => {
		const rows = Array.from({ length: 12 }, (_, index) => row(12 - index));
		const { source } = fakeClient(missingTable, { data: rows, error: null });

		const quiz = await source().getQuiz("scam-awareness");

		expect(quiz).toMatchObject(LEGACY_QUIZ_META);
		expect(quiz?.questions).toHaveLength(QUIZ_QUESTION_LIMIT);
		expect(quiz?.questions.map((question) => question.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(quiz?.questions[0].scenario.kind).toBe("pin-entry");
		expect(quiz?.questions[1].scenario.kind).toBe("image-pair");
	});

	it("knows no other quiz before the quizzes table exists", async () => {
		const { source, client } = fakeClient(missingTable, { data: [row(1)], error: null });
		await expect(source().getQuiz("other-quiz")).resolves.toBeNull();
		expect(client.rpc).not.toHaveBeenCalled();
	});

	it("serves only the questions of the requested quiz once quizzes exist", async () => {
		const otherQuiz = "0b3c0a4e-5f6d-4c8e-9a1b-2c3d4e5f6a7b";
		const quizRow = {
			id: otherQuiz,
			slug: "romance-scams",
			title: "โรแมนซ์สแกม",
			description: null,
			locale: "th",
			status: "published",
			version: 3,
		};
		const { source } = fakeClient(
			{ data: quizRow, error: null },
			{ data: [row(1, DEFAULT_QUIZ_ID), row(2, otherQuiz), row(1, otherQuiz), row(3)], error: null },
		);

		const quiz = await source().getQuiz("romance-scams");

		expect(quiz).toMatchObject({ id: otherQuiz, slug: "romance-scams", description: "", version: 3 });
		expect(quiz?.questions.map((question) => question.id)).toEqual([
			`question-1-${otherQuiz}`,
			`question-2-${otherQuiz}`,
		]);
	});

	it("returns null for an unpublished or unknown quiz and for invalid slugs", async () => {
		const { source, client } = fakeClient({ data: null, error: null }, { data: [row(1)], error: null });
		await expect(source().getQuiz("draft-quiz")).resolves.toBeNull();
		await expect(source().getQuiz("DROP TABLE")).resolves.toBeNull();
		expect(client.rpc).not.toHaveBeenCalled();
	});

	it("throws on database errors so a failure is never cached as not found", async () => {
		const rpcFailure = fakeClient(missingTable, { data: null, error: { message: "timeout" } });
		await expect(rpcFailure.source().getQuiz("scam-awareness")).rejects.toBeInstanceOf(ContentSourceError);

		const quizFailure = fakeClient({ data: null, error: { code: "42501", message: "denied" } }, { data: [], error: null });
		await expect(quizFailure.source().getQuiz("scam-awareness")).rejects.toBeInstanceOf(ContentSourceError);
	});

	it("caches with the content tags for an hour", async () => {
		const { source } = fakeClient(missingTable, { data: [row(1), row(2)], error: null });
		await source(true).getQuiz("scam-awareness");

		expect(unstable_cache).toHaveBeenCalledWith(expect.any(Function), ["content", "supabase", "quiz", "scam-awareness"], {
			tags: ["content", "content:quiz:scam-awareness"],
			revalidate: 3600,
		});
	});

	it("lists quizzes with their question counts", async () => {
		const { source } = fakeClient(missingTable, { data: [row(1), row(2)], error: null });
		await expect(source().listQuizzes()).resolves.toEqual([{ ...LEGACY_QUIZ_META, questionCount: 2 }]);
	});
});

describe("revalidateQuizContent", () => {
	it("expires the quiz and the quiz list immediately", () => {
		revalidateQuizContent("scam-awareness");
		expect(revalidateTag).toHaveBeenCalledWith("content:quiz:scam-awareness", { expire: 0 });
		expect(revalidateTag).toHaveBeenCalledWith("content:quizzes", { expire: 0 });
	});
});
