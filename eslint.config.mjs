import tseslint from "typescript-eslint";
import tsdoc from "eslint-plugin-tsdoc";

export default [
	{
		ignores: ["**/dist/**", "**/coverage/**", "**/vendor/**", "**/tapes/**"],
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tseslint.parser,
		},
		plugins: { tsdoc },
		rules: {
			"tsdoc/syntax": "warn",
		},
	},
];
