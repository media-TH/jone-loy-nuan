import { existsSync } from "node:fs";
import path from "node:path";
import {
	RISK_COPY,
	RISK_LEVELS,
	getRiskAssessment,
	getRiskLevel,
	toScoreOutOfTen,
	type RiskLevel,
} from "@/lib/quiz/risk";

describe("toScoreOutOfTen", () => {
	it("normalises to a 0–10 scale", () => {
		expect(toScoreOutOfTen(7, 10)).toBe(7);
		expect(toScoreOutOfTen(10, 20)).toBe(5);
		expect(toScoreOutOfTen(20, 20)).toBe(10);
	});

	it("rounds half up", () => {
		expect(toScoreOutOfTen(7, 20)).toBe(4); // 3.5
		expect(toScoreOutOfTen(17, 20)).toBe(9); // 8.5
		expect(toScoreOutOfTen(4, 12)).toBe(3); // 3.33
		expect(toScoreOutOfTen(11, 12)).toBe(9); // 9.17
	});

	it("treats an empty or invalid quiz as 0", () => {
		expect(toScoreOutOfTen(0, 0)).toBe(0);
		expect(toScoreOutOfTen(5, 0)).toBe(0);
		expect(toScoreOutOfTen(5, -10)).toBe(0);
		expect(toScoreOutOfTen(Number.NaN, 10)).toBe(0);
		expect(toScoreOutOfTen(5, Number.POSITIVE_INFINITY)).toBe(0);
	});

	it("clamps scores outside 0..total", () => {
		expect(toScoreOutOfTen(-3, 10)).toBe(0);
		expect(toScoreOutOfTen(15, 10)).toBe(10);
	});
});

describe("getRiskLevel", () => {
	const expectations: Array<[score: number, level: RiskLevel]> = [
		[0, "high"],
		[1, "high"],
		[2, "high"],
		[3, "high"],
		[4, "medium"],
		[5, "medium"],
		[6, "medium"],
		[7, "medium"],
		[8, "medium"],
		[9, "low"],
		[10, "low"],
	];

	it.each(expectations)("scores %i/10 as %s", (score, level) => {
		expect(getRiskLevel(score, 10)).toBe(level);
	});

	it("applies the thresholds after rounding for other totals", () => {
		expect(getRiskLevel(6, 20)).toBe("high"); // 3.0
		expect(getRiskLevel(7, 20)).toBe("medium"); // 3.5 → 4
		expect(getRiskLevel(16, 20)).toBe("medium"); // 8.0
		expect(getRiskLevel(17, 20)).toBe("low"); // 8.5 → 9
		expect(getRiskLevel(4, 12)).toBe("high"); // 3.33 → 3
		expect(getRiskLevel(5, 12)).toBe("medium"); // 4.17 → 4
		expect(getRiskLevel(10, 12)).toBe("medium"); // 8.33 → 8
		expect(getRiskLevel(11, 12)).toBe("low"); // 9.17 → 9
	});

	it("treats a quiz with no questions as high risk", () => {
		expect(getRiskLevel(0, 0)).toBe("high");
	});
});

describe("RISK_COPY", () => {
	it.each(RISK_LEVELS)("has complete Thai copy for %s", (level) => {
		const copy = RISK_COPY[level];
		expect(copy.label).toMatch(/^ความเสี่ยง/);
		expect(copy.title.length).toBeGreaterThan(0);
		expect(copy.description.length).toBeGreaterThan(0);
		expect(copy.illustrationAlt.length).toBeGreaterThan(0);
		expect(copy.tips.length).toBeGreaterThan(0);
	});

	it.each(RISK_LEVELS)("points %s at an illustration that exists in public/", (level) => {
		const { illustration } = RISK_COPY[level];
		expect(illustration).toBe(`/images/results/risk-${level}.svg`);
		expect(existsSync(path.join(process.cwd(), "public", illustration))).toBe(true);
	});

	it("maps levels to status tones", () => {
		expect(RISK_COPY.low.tone).toBe("safe");
		expect(RISK_COPY.medium.tone).toBe("caution");
		expect(RISK_COPY.high.tone).toBe("flag");
	});
});

describe("getRiskAssessment", () => {
	it("combines level, normalised score and copy", () => {
		const result = getRiskAssessment(9, 10);
		expect(result.level).toBe("low");
		expect(result.scoreOutOfTen).toBe(9);
		expect(result.title).toBe(RISK_COPY.low.title);
		expect(result.illustration).toBe("/images/results/risk-low.svg");
	});
});
