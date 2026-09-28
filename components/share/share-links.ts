/**
 * Share targets for a link. Pure functions (no browser APIs), so they work in RSC, client
 * components and tests alike. Both endpoints take the URL only: LINE and Facebook build the
 * preview from the page's own Open Graph tags, so a /s/{score} link previews with its score card.
 */

export const LINE_SHARE_ENDPOINT = "https://social-plugins.line.me/lineit/share";
export const FACEBOOK_SHARE_ENDPOINT = "https://www.facebook.com/sharer/sharer.php";

/** LINE's share dialog: opens the LINE app on phones, a web picker on desktop. */
export function lineShareHref(url: string): string {
	return `${LINE_SHARE_ENDPOINT}?url=${encodeURIComponent(url)}`;
}

/** Facebook's sharer dialog. */
export function facebookShareHref(url: string): string {
	return `${FACEBOOK_SHARE_ENDPOINT}?u=${encodeURIComponent(url)}`;
}

/** The message that goes with a shared score. Carries the score only, never answers or names. */
export function scoreShareText(scoreOutOfTen: number, total = 10): string {
	return `ฉันสแกนกลโกงได้ ${scoreOutOfTen}/${total} ลองดูว่าคุณจับธงแดงของมิจฉาชีพได้กี่จุด`;
}
