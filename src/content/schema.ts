import { z } from "zod";

export const Language = z.enum(["fr", "it"]);
export type Language = z.infer<typeof Language>;

export const Level = z.enum(["basic", "intermediate", "advanced"]);
export type Level = z.infer<typeof Level>;

const NonEmpty = z.string().min(1);

const ExerciseBase = z.object({
	id: NonEmpty,
	number: z.number().int().positive(),
	title: NonEmpty,
	instructions: z.string().optional(),
});

const FillBlankItem = z.object({
	sentence: NonEmpty,
	blanks: z
		.array(
			z.object({
				answer: z.union([NonEmpty, z.array(NonEmpty).min(1)]),
				hint: z.string().optional(),
			}),
		)
		.min(1),
});

export const FillBlankExercise = ExerciseBase.extend({
	kind: z.literal("fill-blank"),
	wordBank: z.array(NonEmpty).optional(),
	items: z.array(FillBlankItem).min(1),
});

export const InlineChoiceExercise = ExerciseBase.extend({
	kind: z.literal("inline-choice"),
	items: z
		.array(
			z.object({
				sentence: NonEmpty,
				choices: z
					.array(
						z.object({
							options: z.array(NonEmpty).min(2),
							correct: z.number().int().nonnegative(),
						}),
					)
					.min(1),
			}),
		)
		.min(1),
});

export const ChoiceExercise = ExerciseBase.extend({
	kind: z.literal("choice"),
	multiple: z.boolean(),
	items: z
		.array(
			z.object({
				prompt: NonEmpty,
				options: z.array(NonEmpty).min(2),
				correct: z.union([
					z.number().int().nonnegative(),
					z.array(z.number().int().nonnegative()).min(1),
				]),
			}),
		)
		.min(1),
});

export const MatchExercise = ExerciseBase.extend({
	kind: z.literal("match"),
	pairs: z
		.array(
			z.object({
				left: NonEmpty,
				right: NonEmpty,
			}),
		)
		.min(2),
});

export const CategorizeExercise = ExerciseBase.extend({
	kind: z.literal("categorize"),
	categories: z.array(NonEmpty).min(2),
	items: z
		.array(
			z.object({
				word: NonEmpty,
				category: NonEmpty,
			}),
		)
		.min(1),
});

export const ReorderExercise = ExerciseBase.extend({
	kind: z.literal("reorder"),
	items: z
		.array(
			z.object({
				correctOrder: z.array(NonEmpty).min(2),
			}),
		)
		.min(1),
});

export const JudgmentExercise = ExerciseBase.extend({
	kind: z.literal("judgment"),
	items: z
		.array(
			z.object({
				sentence: NonEmpty,
				possible: z.boolean(),
			}),
		)
		.min(1),
});

export const FreeTextExercise = ExerciseBase.extend({
	kind: z.literal("free-text"),
	items: z
		.array(
			z.object({
				prompt: NonEmpty,
				contextHint: z.string().optional(),
				accepted: z.array(NonEmpty).min(1),
			}),
		)
		.min(1),
});

export const AnagramExercise = ExerciseBase.extend({
	kind: z.literal("anagram"),
	items: z
		.array(
			z.object({
				scrambled: NonEmpty,
				answer: NonEmpty,
			}),
		)
		.min(1),
});

export const AudioFillExercise = ExerciseBase.extend({
	kind: z.literal("audio-fill"),
	audioUrl: NonEmpty,
	items: z.array(FillBlankItem).min(1),
});

export const Exercise = z.discriminatedUnion("kind", [
	FillBlankExercise,
	InlineChoiceExercise,
	ChoiceExercise,
	MatchExercise,
	CategorizeExercise,
	ReorderExercise,
	JudgmentExercise,
	FreeTextExercise,
	AnagramExercise,
	AudioFillExercise,
]);
export type Exercise = z.infer<typeof Exercise>;
export type ExerciseKind = Exercise["kind"];

// Per-kind type aliases (so consumers can `import type { FillBlankExercise }`
// without colliding with the Zod schema value of the same name).
export type FillBlankExercise = z.infer<typeof FillBlankExercise>;
export type InlineChoiceExercise = z.infer<typeof InlineChoiceExercise>;
export type ChoiceExercise = z.infer<typeof ChoiceExercise>;
export type MatchExercise = z.infer<typeof MatchExercise>;
export type CategorizeExercise = z.infer<typeof CategorizeExercise>;
export type ReorderExercise = z.infer<typeof ReorderExercise>;
export type JudgmentExercise = z.infer<typeof JudgmentExercise>;
export type FreeTextExercise = z.infer<typeof FreeTextExercise>;
export type AnagramExercise = z.infer<typeof AnagramExercise>;
export type AudioFillExercise = z.infer<typeof AudioFillExercise>;

export const ExerciseSet = z.object({
	language: Language,
	level: Level,
	control: z.boolean(),
	title: NonEmpty,
	exercises: z.array(Exercise).min(1),
});
export type ExerciseSet = z.infer<typeof ExerciseSet>;

const InlineSegment = z.union([
	z.object({ type: z.literal("text"), text: NonEmpty }),
	z.object({ type: z.literal("emph"), text: NonEmpty }),
	z.object({ type: z.literal("strong"), text: NonEmpty }),
]);

const RichText = z.array(InlineSegment).min(1);

export const TheoryBlock = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("heading"),
		level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
		text: NonEmpty,
	}),
	z.object({ kind: z.literal("paragraph"), content: RichText }),
	z.object({
		kind: z.literal("example"),
		text: NonEmpty,
		translation: z.string().optional(),
	}),
	z.object({
		kind: z.literal("list"),
		ordered: z.boolean(),
		items: z.array(NonEmpty).min(1),
	}),
	z.object({
		kind: z.literal("table"),
		headers: z.array(NonEmpty).min(1),
		rows: z.array(z.array(z.string()).min(1)).min(1),
	}),
	z.object({ kind: z.literal("note"), text: NonEmpty }),
]);
export type TheoryBlock = z.infer<typeof TheoryBlock>;

export const TheoryDoc = z.object({
	language: Language,
	title: NonEmpty,
	blocks: z.array(TheoryBlock).min(1),
});
export type TheoryDoc = z.infer<typeof TheoryDoc>;

export const Landing = z.object({
	es: NonEmpty,
	fr: NonEmpty,
	it: NonEmpty,
});
export type Landing = z.infer<typeof Landing>;
