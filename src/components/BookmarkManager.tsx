import { Bookmark, Plus, Star, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSeedBookmarks } from "@/utils";

interface BookmarkManagerProps {
	isOpen: boolean;
	onClose: () => void;
	currentSeed: number;
	onSeedChange: (seed: number) => void;
}

export function BookmarkManager({
	isOpen,
	onClose,
	currentSeed,
	onSeedChange,
}: BookmarkManagerProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [newBookmarkName, setNewBookmarkName] = useState("");
	const {
		masterBookmark,
		bookmarks,
		setMasterBookmark,
		addBookmark,
		deleteBookmark,
	} = useSeedBookmarks();

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen) dialog.showModal();
		else dialog.close();
	}, [isOpen]);

	const handleSetMaster = () => {
		setMasterBookmark(currentSeed);
	};

	const handleGoToMaster = () => {
		if (masterBookmark !== null) {
			onSeedChange(masterBookmark);
			onClose();
		}
	};

	const handleAddBookmark = (e: React.FormEvent) => {
		e.preventDefault();
		if (newBookmarkName.trim()) {
			addBookmark(newBookmarkName.trim(), currentSeed);
			setNewBookmarkName("");
		}
	};

	const handleGoToBookmark = (seed: number) => {
		onSeedChange(seed);
		onClose();
	};

	return (
		<dialog
			ref={dialogRef}
			closedby="any"
			className="backdrop:bg-black/70 dark:backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-0 m-auto border-0"
			onClose={onClose}
		>
			<div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex justify-between items-center">
				<div className="flex items-center gap-3">
					<Bookmark className="w-6 h-6 text-white" />
					<h2 className="text-2xl font-bold text-white drop-shadow-sm">
						Seed Bookmarks
					</h2>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/90 hover:text-white"
					aria-label="Close"
				>
					<X className="w-6 h-6" />
				</button>
			</div>

			<div className="p-6 space-y-6">
				{/* Current Seed Display */}
				<div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
					<div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
						Current Seed
					</div>
					<div className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">
						{currentSeed}
					</div>
				</div>

				{/* Master Bookmark */}
				<div>
					<h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
						Master Bookmark
					</h3>
					<div className="bg-gradient-to-br from-amber-50 dark:from-amber-900/30 to-yellow-50 dark:to-yellow-900/30 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
						{masterBookmark !== null ? (
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Star
										className="w-5 h-5 text-amber-500"
										fill="currentColor"
									/>
									<span className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100">
										{masterBookmark}
									</span>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={handleGoToMaster}
										className="px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
									>
										Go to
									</button>
									<button
										type="button"
										onClick={handleSetMaster}
										className="px-3 py-1.5 text-sm font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
									>
										Update
									</button>
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Star className="w-5 h-5 text-amber-400" />
									<span className="text-slate-500 dark:text-slate-400 italic">
										No master bookmark set
									</span>
								</div>
								<button
									type="button"
									onClick={handleSetMaster}
									className="px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
								>
									Set as Master
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Named Bookmarks */}
				<div>
					<h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
						Named Bookmarks
					</h3>

					{/* Add Bookmark Form */}
					<form onSubmit={handleAddBookmark} className="mb-4">
						<div className="flex gap-2">
							<input
								type="text"
								value={newBookmarkName}
								onChange={(e) => setNewBookmarkName(e.target.value)}
								placeholder="Bookmark name..."
								className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
								maxLength={30}
							/>
							<button
								type="submit"
								className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
							>
								<Plus className="w-4 h-4" />
								Add
							</button>
						</div>
					</form>

					{/* Bookmarks List */}
					<div className="space-y-2">
						{bookmarks.length === 0 ? (
							<div className="text-center py-8 text-slate-400 dark:text-slate-500 italic">
								No bookmarks yet. Add one above!
							</div>
						) : (
							bookmarks.map((bookmark) => (
								<div
									key={bookmark.name}
									className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
								>
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<Bookmark className="w-4 h-4 text-indigo-500 flex-shrink-0" />
										<div className="min-w-0 flex-1">
											<div className="font-medium text-slate-800 dark:text-slate-100 truncate">
												{bookmark.name}
											</div>
											<div className="text-sm font-mono text-slate-500 dark:text-slate-400">
												{bookmark.seed}
											</div>
										</div>
									</div>
									<div className="flex gap-2 flex-shrink-0">
										<button
											type="button"
											onClick={() => handleGoToBookmark(bookmark.seed)}
											className="px-3 py-1.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
										>
											Go to
										</button>
										<button
											type="button"
											onClick={() => deleteBookmark(bookmark.name)}
											className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
											aria-label="Delete bookmark"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</dialog>
	);
}
