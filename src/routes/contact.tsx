import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({ component: Contact });

function Contact() {
	return (
		<div className="p-4 md:p-6 max-w-3xl mx-auto">
			<div className="flex items-center gap-3 mb-8">
				<div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20">
					<MessageCircle className="w-7 h-7 text-indigo-950" />
				</div>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-800">
						Contact
					</h1>
					<p className="text-sm text-slate-500">Get in touch</p>
				</div>
			</div>

			<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/50 p-6 md:p-8 space-y-6">
				<section>
					<p className="text-slate-700 text-lg leading-relaxed mb-6">
						Have questions, feedback, or suggestions? Feel free to reach out!
					</p>

					<div className="space-y-4">
						<div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
							<div className="p-2 bg-blue-500 rounded-lg text-white mt-1">
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-slate-800 mb-1">
									X (Twitter)
								</h3>
								<a
									href="https://x.com/thasmin"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-700 underline font-medium"
								>
									@thasmin
								</a>
							</div>
						</div>

						<div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
							<div className="p-2 bg-purple-500 rounded-lg text-white mt-1">
								<Mail className="w-5 h-5" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold text-slate-800 mb-1">Email</h3>
								<a
									href="mailto:dan@axelby.com"
									className="text-purple-600 hover:text-purple-700 underline font-medium"
								>
									dan@axelby.com
								</a>
							</div>
						</div>
					</div>
				</section>

				<section className="border-t border-slate-200 pt-6">
					<h2 className="text-lg font-bold text-slate-800 mb-3">
						About the Developer
					</h2>
					<p className="text-slate-600 leading-relaxed">
						CatPlanner was created by Dan to help Battle Cats players make the
						most of their gacha rolls. The gacha algorithm was reverse-engineered
						from{" "}
						<a
							href="https://github.com/godfat/battle-cats-rolls"
							target="_blank"
							rel="noopener noreferrer"
							className="text-indigo-600 hover:text-indigo-700 underline"
						>
							battle-cats-rolls
						</a>{" "}
						by godfat.
					</p>
				</section>
			</div>
		</div>
	);
}
