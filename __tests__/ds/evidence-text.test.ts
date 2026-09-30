import { splitEvidence, type EvidenceSegment } from "@/components/ds/evidence-text";

const joined = (segments: EvidenceSegment[]) => segments.map((segment) => segment.text).join("");

describe("splitEvidence", () => {
	const url = "https://bot-refund.co/claim?id=0812345678";

	it("returns nothing for an empty string", () => {
		expect(splitEvidence("", [{ start: 0, end: 3, flag: 1 }])).toEqual([]);
	});

	it("returns one plain segment without highlights", () => {
		expect(splitEvidence("1213")).toEqual([{ text: "1213", start: 0, end: 4 }]);
		expect(splitEvidence("1213", [])).toEqual([{ text: "1213", start: 0, end: 4 }]);
	});

	it("splits around a highlight in the middle", () => {
		expect(splitEvidence(url, [{ start: 8, end: 21, flag: 1 }])).toEqual([
			{ text: "https://", start: 0, end: 8 },
			{ text: "bot-refund.co", start: 8, end: 21, flag: 1 },
			{ text: "/claim?id=0812345678", start: 21, end: url.length },
		]);
	});

	it("handles highlights at the very start and end", () => {
		expect(splitEvidence("OTP 482913", [
			{ start: 4, end: 10, flag: 2 },
			{ start: 0, end: 3, flag: 1 },
		])).toEqual([
			{ text: "OTP", start: 0, end: 3, flag: 1 },
			{ text: " ", start: 3, end: 4 },
			{ text: "482913", start: 4, end: 10, flag: 2 },
		]);
	});

	it("sorts unsorted highlights by position", () => {
		const segments = splitEvidence("abcdefghij", [
			{ start: 6, end: 8, flag: 2 },
			{ start: 1, end: 3, flag: 1 },
		]);
		expect(segments.map((segment) => segment.flag)).toEqual([undefined, 1, undefined, 2, undefined]);
	});

	it("keeps adjacent highlights as separate flags", () => {
		expect(splitEvidence("abcdef", [
			{ start: 0, end: 3, flag: 1 },
			{ start: 3, end: 6, flag: 2 },
		])).toEqual([
			{ text: "abc", start: 0, end: 3, flag: 1 },
			{ text: "def", start: 3, end: 6, flag: 2 },
		]);
	});

	it("trims an overlapping highlight to start where the earlier one ends", () => {
		expect(splitEvidence("abcdefghij", [
			{ start: 2, end: 6, flag: 1 },
			{ start: 4, end: 8, flag: 2 },
		])).toEqual([
			{ text: "ab", start: 0, end: 2 },
			{ text: "cdef", start: 2, end: 6, flag: 1 },
			{ text: "gh", start: 6, end: 8, flag: 2 },
			{ text: "ij", start: 8, end: 10 },
		]);
	});

	it("drops a highlight that is fully inside an earlier one", () => {
		expect(splitEvidence("abcdefghij", [
			{ start: 3, end: 5, flag: 2 },
			{ start: 1, end: 8, flag: 1 },
		])).toEqual([
			{ text: "a", start: 0, end: 1 },
			{ text: "bcdefgh", start: 1, end: 8, flag: 1 },
			{ text: "ij", start: 8, end: 10 },
		]);
	});

	it("prefers the longer highlight when two start together", () => {
		expect(splitEvidence("abcdef", [
			{ start: 0, end: 2, flag: 1 },
			{ start: 0, end: 4, flag: 2 },
		])).toEqual([
			{ text: "abcd", start: 0, end: 4, flag: 2 },
			{ text: "ef", start: 4, end: 6 },
		]);
	});

	it("clamps out-of-range offsets into the string", () => {
		expect(splitEvidence("abcdef", [
			{ start: -5, end: 2, flag: 1 },
			{ start: 4, end: 99, flag: 2 },
		])).toEqual([
			{ text: "ab", start: 0, end: 2, flag: 1 },
			{ text: "cd", start: 2, end: 4 },
			{ text: "ef", start: 4, end: 6, flag: 2 },
		]);
		expect(splitEvidence("abc", [{ start: 0, end: Number.POSITIVE_INFINITY, flag: 1 }])).toEqual([
			{ text: "abc", start: 0, end: 3, flag: 1 },
		]);
	});

	it("drops empty, reversed, NaN and fully out-of-range highlights", () => {
		expect(splitEvidence("abcdef", [
			{ start: 2, end: 2, flag: 1 },
			{ start: 5, end: 1, flag: 2 },
			{ start: Number.NaN, end: 3, flag: 3 },
			{ start: 10, end: 20, flag: 4 },
			{ start: -9, end: -1, flag: 5 },
		])).toEqual([{ text: "abcdef", start: 0, end: 6 }]);
	});

	it("truncates fractional offsets", () => {
		expect(splitEvidence("abcdef", [{ start: 1.9, end: 3.2, flag: 1 }])).toEqual([
			{ text: "a", start: 0, end: 1 },
			{ text: "bc", start: 1, end: 3, flag: 1 },
			{ text: "def", start: 3, end: 6 },
		]);
	});

	it("always covers the text exactly once, in order", () => {
		const highlights = [
			{ start: 30, end: 41, flag: 3 },
			{ start: 8, end: 18, flag: 1 },
			{ start: 12, end: 25, flag: 2 },
			{ start: -3, end: 2, flag: 4 },
		];
		const segments = splitEvidence(url, highlights);

		expect(joined(segments)).toBe(url);
		segments.forEach((segment, index) => {
			expect(segment.text).toBe(url.slice(segment.start, segment.end));
			expect(segment.end).toBeGreaterThan(segment.start);
			if (index > 0) expect(segment.start).toBe(segments[index - 1].end);
		});
	});

	it("does not mutate the highlights it is given", () => {
		const highlights = [
			{ start: 6, end: 8, flag: 2 },
			{ start: -1, end: 3, flag: 1 },
		];
		const snapshot = JSON.parse(JSON.stringify(highlights));
		splitEvidence("abcdefghij", highlights);
		expect(highlights).toEqual(snapshot);
	});
});
