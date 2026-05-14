import { describe, expect, it } from "vitest";
import { FillBlankExercise, Landing } from "#/content/schema";

const baseFillBlank = {
	id: "fr-basic-1",
	number: 1,
	title: "Exercice 1",
	kind: "fill-blank" as const,
	items: [
		{
			sentence: "J'{{0}} mangé.",
			blanks: [{ answer: "ai" }],
		},
	],
};

describe("FillBlankExercise", () => {
	it("validates successfully with contextHint present", () => {
		const result = FillBlankExercise.safeParse({
			...baseFillBlank,
			contextHint: "Lisez ce passage avant de compléter les blancs.",
		});
		expect(result.success).toBe(true);
	});

	it("validates successfully without contextHint (backward compat)", () => {
		const result = FillBlankExercise.safeParse(baseFillBlank);
		expect(result.success).toBe(true);
	});
});

describe("Landing", () => {
	it("validates successfully with fr and it only", () => {
		const result = Landing.safeParse({
			fr: "Texte français",
			it: "Testo italiano",
		});
		expect(result.success).toBe(true);
	});

	it("throws ZodError when es key is present (strict mode)", () => {
		const result = Landing.safeParse({
			es: "Texto español",
			fr: "Texte français",
			it: "Testo italiano",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.code === "unrecognized_keys"),
			).toBe(true);
		}
	});
});
