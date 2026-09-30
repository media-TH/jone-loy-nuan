import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,
	...next,
	{
		rules: {
			"react/no-unescaped-entities": "off",
			"@next/next/no-page-custom-font": "off",
		},
	},
	{
		// Animation configs are intentionally loosely typed (see AGENTS.md → TypeScript & Animation Code).
		files: ["lib/motion/**", "components/motion/**"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
	{
		ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
	},
];

export default eslintConfig;
