import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdateToast() {
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW();

	if (!needRefresh) return null;

	return (
		<div
			role="status"
			aria-live="polite"
			className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 transform items-center gap-3 rounded-lg border border-[var(--c-border)] bg-[var(--c-card)] px-4 py-3 text-sm text-[var(--c-fg)] shadow-lg"
		>
			<span>Nouvelle version disponible</span>
			<button
				type="button"
				onClick={() => updateServiceWorker(true)}
				className="rounded bg-[var(--c-primary)] px-3 py-1 text-xs font-semibold text-[var(--c-primary-fg)] hover:opacity-90"
			>
				Recharger
			</button>
			<button
				type="button"
				onClick={() => setNeedRefresh(false)}
				aria-label="Fermer"
				className="text-base leading-none opacity-60 hover:opacity-100"
			>
				×
			</button>
		</div>
	);
}
