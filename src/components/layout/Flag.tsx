interface FlagProps {
	section: "fr" | "it";
	size?: number;
	className?: string;
}

const ALT: Record<"fr" | "it", string> = {
	fr: "Bandera de Francia",
	it: "Bandera de Italia",
};

export function Flag({ section, size = 20, className }: FlagProps) {
	return (
		<img
			src={`/flags/${section}.png`}
			alt={ALT[section]}
			width={size}
			height={Math.round((size * 2) / 3)}
			className={`inline-block rounded-sm object-cover shadow-sm ${className ?? ""}`}
			loading="lazy"
			decoding="async"
		/>
	);
}
