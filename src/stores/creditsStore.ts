import { create } from "zustand";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface CreditsStore {
	remaining: number | null;
	total: number;
	reset: number | null;
	loading: boolean;
	/** Fetch credits from the API. No-ops if already loaded unless force=true. */
	fetchCredits: (force?: boolean) => Promise<void>;
	/** Sync exact values from a generate-PR API response. */
	setCredits: (data: { remaining: number; total: number; reset: number }) => void;
}

export const useCreditsStore = create<CreditsStore>((set, get) => ({
	remaining: null,
	total: 20,
	reset: null,
	loading: false,

	fetchCredits: async (force = false) => {
		if (get().loading) return;
		if (!force && get().remaining !== null) return;
		set({ loading: true });
		try {
			const res = await fetchWithAuth("/api/user/credits");
			if (res.ok) {
				const data = await res.json();
				set({ remaining: data.remaining, total: data.total, reset: data.reset });
			}
		} catch {
			// silent fail — UI shows "—" when null
		} finally {
			set({ loading: false });
		}
	},

	setCredits: ({ remaining, total, reset }) =>
		set({ remaining, total, reset }),
}));
