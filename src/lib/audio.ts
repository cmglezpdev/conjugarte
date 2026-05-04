import { useCallback, useEffect, useRef, useState } from "react";

export type AudioState = "idle" | "playing" | "paused" | "error";

export interface UseAudioOptions {
	autoPlay?: boolean;
}

export interface UseAudioReturn {
	state: AudioState;
	play: () => Promise<void>;
	pause: () => void;
	replay: () => Promise<void>;
}

/**
 * useAudio — controls an HTMLAudioElement via a ref.
 * The audio element is created lazily and reused across renders.
 * HTMLMediaElement.play/pause/load are mocked in tests (see setup.ts).
 */
export function useAudio(
	src: string,
	options: UseAudioOptions = {},
): UseAudioReturn {
	const { autoPlay = false } = options;
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [state, setState] = useState<AudioState>("idle");

	// Initialise the audio element once
	useEffect(() => {
		const audio = new Audio(src);

		audio.addEventListener("ended", () => setState("idle"));
		audio.addEventListener("error", () => setState("error"));

		audioRef.current = audio;

		return () => {
			audio.pause();
			audio.removeEventListener("ended", () => setState("idle"));
			audio.removeEventListener("error", () => setState("error"));
		};
	}, [src]);

	// Auto-play on mount if requested
	useEffect(() => {
		if (!autoPlay) return;
		const audio = audioRef.current;
		if (!audio) return;
		audio
			.play()
			.then(() => setState("playing"))
			.catch(() => setState("error"));
	}, [autoPlay]);

	const play = useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) return;
		try {
			await audio.play();
			setState("playing");
		} catch {
			setState("error");
		}
	}, []);

	const pause = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.pause();
		setState("paused");
	}, []);

	const replay = useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.currentTime = 0;
		try {
			await audio.play();
			setState("playing");
		} catch {
			setState("error");
		}
	}, []);

	return { state, play, pause, replay };
}
