import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import { BookmarkManager } from "@/components/BookmarkManager";
import { CatDialog } from "@/components/CatDialog";
import { useCatSeed } from "@/utils";

interface DialogContextValue {
	openCatDialog: (catId: number) => void;
	closeCatDialog: () => void;
	openBookmarkManager: () => void;
	closeBookmarkManager: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
	const [selectedCatId, setSelectedCatId] = useState<number | undefined>();
	const [showBookmarkManager, setShowBookmarkManager] = useState(false);
	const [seed, setSeed] = useCatSeed();

	const value = useMemo(
		() => ({
			openCatDialog: (catId: number) => setSelectedCatId(catId),
			closeCatDialog: () => setSelectedCatId(undefined),
			openBookmarkManager: () => setShowBookmarkManager(true),
			closeBookmarkManager: () => setShowBookmarkManager(false),
		}),
		[],
	);

	return (
		<DialogContext.Provider value={value}>
			{children}
			<CatDialog
				catId={selectedCatId}
				onClose={() => setSelectedCatId(undefined)}
			/>
			<BookmarkManager
				isOpen={showBookmarkManager}
				onClose={() => setShowBookmarkManager(false)}
				currentSeed={seed}
				onSeedChange={setSeed}
			/>
		</DialogContext.Provider>
	);
}

export function useDialogs() {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error("useDialogs must be used within DialogProvider");
	}
	return context;
}
