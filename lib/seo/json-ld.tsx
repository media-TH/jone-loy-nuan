/**
 * <JsonLd> — renders schema.org structured data as an inline data block.
 *
 * JSON.stringify alone is not safe inside <script>: a string containing "</script>" or "<!--"
 * would end the element early and let page content be parsed as HTML. Every "<", ">" and "&" is
 * therefore written as its JSON unicode escape, which parsers read back as the same character.
 */

export type JsonLdValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| JsonLdNode
	| readonly JsonLdValue[];

export type JsonLdNode = { readonly [key: string]: JsonLdValue };

const UNSAFE_IN_SCRIPT = /[<>&]/g;
const ESCAPES: Record<string, string> = {
	"<": "\\u003c",
	">": "\\u003e",
	"&": "\\u0026",
};

/** JSON for a `<script type="application/ld+json">` body, with HTML-significant characters escaped. */
export function serializeJsonLd(data: JsonLdNode | readonly JsonLdNode[]): string {
	return JSON.stringify(data).replace(UNSAFE_IN_SCRIPT, (char) => ESCAPES[char] ?? char);
}

type JsonLdProps = {
	data: JsonLdNode | readonly JsonLdNode[];
};

export function JsonLd({ data }: JsonLdProps) {
	return (
		<script
			type="application/ld+json"
			// Safe: serializeJsonLd escapes every character that could close or comment out the tag.
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
		/>
	);
}
