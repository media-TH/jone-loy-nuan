/**
 * Share landing pages: /s/{score} for a score out of 10.
 *
 * The URL carries nothing but the rounded score, never a name, id or answer, so a shared link or
 * its preview image reveals no personal data.
 */

import { getRiskLevel, toScoreOutOfTen, type RiskLevel } from "@/lib/quiz/risk";
import { absoluteUrl } from "@/lib/seo/site";

export const SHARE_TOTAL = 10;

/** Every score that has a share page: 0 … 10. */
export const SHARE_SCORES: readonly number[] = Array.from({ length: SHARE_TOTAL + 1 }, (_, i) => i);

/** Route param → score, or null for anything but a canonical "0" … "10". */
export function parseShareScore(value: string): number | null {
	return /^(?:10|[0-9])$/.test(value) ? Number(value) : null;
}

export function getShareRiskLevel(scoreOutOfTen: number): RiskLevel {
	return getRiskLevel(scoreOutOfTen, SHARE_TOTAL);
}

/** Path of the share page for a finished quiz (normalised to /10 and clamped), e.g. "/s/7". */
export function shareScorePath(score: number, total: number = SHARE_TOTAL): string {
	return `/s/${toScoreOutOfTen(score, total)}`;
}

/** Absolute share URL on the canonical origin, for share sheets and copy-link buttons. */
export function shareScoreUrl(score: number, total: number = SHARE_TOTAL): string {
	return absoluteUrl(shareScorePath(score, total));
}
