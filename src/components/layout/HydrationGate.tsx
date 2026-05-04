import { useEffect } from "react";
import { useProgress } from "#/stores/progress";

interface HydrationGateProps {
	children: React.ReactNode;
}

/**
 * HydrationGate triggers rehydration of the Zustand progress store from
 * localStorage on the client side. It renders its children immediately
 * (no blocking) so SSR output is not delayed, and the store updates once
 * the client-side data is available.
 *
 * Must be mounted once inside the root layout body.
 */
export function HydrationGate({ children }: HydrationGateProps) {
	useEffect(() => {
		// rehydrate() returns a Promise or undefined depending on the storage adapter.
		// We fire-and-forget — the store will notify subscribers when ready.
		useProgress.persist.rehydrate();
	}, []);

	return <>{children}</>;
}
