import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCatDatabase } from "@/utils";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	eventCodes: string[];
}

const EventDetailsDialog: React.FC<Props> = ({
	isOpen,
	eventCodes,
	onClose,
}) => {
	const catDatabase = useCatDatabase();
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen) dialog.showModal();
		else dialog.close();
	}, [isOpen]);

	if (!catDatabase.data) return null;
	const events = eventCodes.map((code) => ({
		...catDatabase.data.events[code],
		code,
	}));

	return (
		<dialog
			ref={dialogRef}
			closedby="any"
			className="backdrop:bg-black/70 dark:backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-0 m-auto border-0"
			onClose={() => onClose()}
		>
			<div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex justify-between items-center">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-bold text-white drop-shadow-sm">
						Events
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

			<div className="p-4 space-y-4">
				{events.map((event) => (
					<div
						key={event.code}
						className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
					>
						<div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
							Event
						</div>
						<div className="font-mono font-bold text-slate-800 dark:text-slate-100">
							{new Date(event.start_on).toLocaleDateString()} -{" "}
							{new Date(event.end_on).toLocaleDateString()}
						</div>
						<div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
							{event.name}
						</div>
					</div>
				))}
			</div>
		</dialog>
	);
};

export default EventDetailsDialog;
