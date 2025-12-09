import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CatDialog, type CatWithId } from "@/components/CatDialog";
import { type CatDatabase, loadCatDatabase } from "@/data/gacha-data";
import { getCatStageImagePath } from "@/utils";

export const Route = createFileRoute("/tierlist")({
	component: RouteComponent,
});

const TierCat: React.FC<{
	catDatabase?: CatDatabase;
	cat: { id: string; name: string };
	onClick?: () => void;
}> = ({ catDatabase, cat, onClick }) => {
	const db = Object.entries(catDatabase?.cats ?? {}).filter((entry) =>
		entry[1].name.some((name) =>
			name.toLowerCase().includes(cat.name.toLowerCase()),
		),
	);

	const catFromDb = catDatabase?.cats[+cat.id];
	if (catFromDb) {
		return (
			<button
				type="button"
				onClick={onClick}
				className="cursor-pointer hover:scale-110 transition-transform"
			>
				<img
					alt={catFromDb.name[0]}
					src={getCatStageImagePath(cat.id, catFromDb.name.length - 1)}
					title={catFromDb.name[0]}
					className="w-16 h-16 object-contain"
				/>
			</button>
		);
	}
	console.error(`Cat not found in database: ${cat.name} (ID: ${cat.id})`, db);
	return null;
};

function RouteComponent() {
	const [selectedCat, setSelectedCat] = useState<CatWithId | null>(null);

	// Load cat database
	const catDatabaseQuery = useQuery({
		queryKey: ["catDatabase"],
		queryFn: loadCatDatabase,
		staleTime: Infinity, // Never refetch
	});
	const catDatabase = catDatabaseQuery.data;

	const tiers = [
		{
			rank: "SS",
			cats: [
				{ id: "520", name: "Lasvoss" },
				{ id: "45", name: "Balrog" },
				{ id: "138", name: "Kasa Jizo" },
				{ id: "706", name: "Dark Phono" },
				{ id: "544", name: "Kasli the Bane" },
				{ id: "732", name: "Izanagi" },
				{ id: "136", name: "Cosmo" },
				{ id: "691", name: "Phono" },
				{ id: "178", name: "Dioramos" },
				{ id: "273", name: "Splendid Ganesha" },
			],
		},
		{
			rank: "S+",
			cats: [
				{ id: "272", name: "Amaterasu" },
				{ id: "788", name: "Dark Lunacia" },
				{ id: "432", name: "Detective Vigler" },
				{ id: "259", name: "Anubis" },
				{ id: "319", name: "Mitama the Oracle" },
				{ id: "662", name: "Chronos the Bride" },
				{ id: "107", name: "Kai" },
				{ id: "535", name: "Hades" },
				{ id: "73", name: "Maeda Keiji" },
				{ id: "262", name: "Hayabusa" },
				{ id: "780", name: "Lunacia" },
				{ id: "60", name: "Baby Cat" },
			],
		},
		{
			rank: "S",
			cats: [
				{ id: "560", name: "Emma" },
				{ id: "195", name: "Akira" },
				{ id: "72", name: "Sanada Yukimura" },
				{ id: "106", name: "Kuu" },
				{ id: "317", name: "Poseidon" },
				{ id: "811", name: "Agent Staal" },
				{ id: "77", name: "Thundia" },
				{ id: "76", name: "Windy" },
				{ id: "305", name: "Gigapult" },
				{ id: "442", name: "D'arktanyan" },
				{ id: "626", name: "Furiluga" },
				{ id: "759", name: "Trixi" },
			],
		},
		{
			rank: "A+",
			cats: [
				{ id: "633", name: "Diabolosa" },
				{ id: "570", name: "Gravolodon" },
				{ id: "172", name: "Balaluga" },
				{ id: "699", name: "Thunder Jack" },
				{ id: "713", name: "Kaoluga" },
				{ id: "661", name: "Daliasan" },
				{ id: "270", name: "Mighty Lord Gao" },
				{ id: "307", name: "Bomburr" },
				{ id: "323", name: "Sarukani" },
				{ id: "336", name: "Ruri" },
				{ id: "358", name: "Deale" },
				{ id: "169", name: "Uesugi Kenshin" },
				{ id: "260", name: "Aphrodite" },
				{ id: "227", name: "Mad Doctor Klay" },
				{ id: "160", name: "Kalisa" },
				{ id: "306", name: "Drednot" },
				{ id: "684", name: "Count Yukimura" },
				{ id: "784", name: "Koneko" },
				{ id: "687", name: "Sirius" },
				{ id: "812", name: "Skanda" },
				{ id: "683", name: "Vega" },
				{ id: "126", name: "Takeda Shingen" },
			],
		},
		{
			rank: "A",
			cats: [
				{ id: "379", name: "Dark Mitama" },
				{ id: "139", name: "Kaguya" },
				{ id: "334", name: "Shadow Gao" },
				{ id: "586", name: "Garu" },
				{ id: "44", name: "Cat Machine" },
				{ id: "530", name: "Kasli" },
				{ id: "739", name: "Izanami" },
				{ id: "534", name: "Saki" },
				{ id: "724", name: "Aset" },
				{ id: "494", name: "Gaia" },
				{ id: "452", name: "Ushiwakamaru" },
				{ id: "169", name: "Asiluga" },
				{ id: "658", name: "Iz" },
				{ id: "171", name: "Tecoluga" },
				{ id: "693", name: "Issun Boshi" },
				{ id: "618", name: "Satoru" },
				{ id: "335", name: "Himeyuri" },
				{ id: "418", name: "Thermae" },
				{ id: "464", name: "Muu" },
				{ id: "197", name: "Catman" },
				{ id: "356", name: "Rekon Korps" },
				{ id: "642", name: "Iz" },
				{ id: "643", name: "Lucifer" },
				{ id: "381", name: "D'artanyan" },
				{ id: "619", name: "Shiro Amakusa" },
				{ id: "361", name: "Mizli" },
				{ id: "108", name: "Coppermine" },
				{ id: "526", name: "Kintaro" },
				{ id: "595", name: "Logistix" },
				{ id: "196", name: "Mekako" },
				{ id: "43", name: "Ice" },
			],
		},
		{
			rank: "B+",
			cats: [
				{ id: "764", name: "Dynasaurus" },
				{ id: "610", name: "Garu" },
				{ id: "608", name: "Kanna" },
				{ id: "545", name: "Nanaho" },
				{ id: "482", name: "Doktor Heaven" },
				{ id: "306", name: "Bora" },
				{ id: "757", name: "Cake Machine" },
				{ id: "479", name: "Lumina" },
				{ id: "332", name: "Bunny & Canard" },
				{ id: "284", name: "Pai-Pai" },
				{ id: "787", name: "Amazing Catman" },
				{ id: "621", name: "Hevijak" },
				{ id: "337", name: "Reika" },
				{ id: "585", name: "Keiji Claus" },
				{ id: "761", name: "Gunduros" },
				{ id: "800", name: "Morta-Loncha" },
				{ id: "397", name: "Ganglion" },
				{ id: "650", name: "Hanzo" },
				{ id: "287", name: "Strike" },
				{ id: "564", name: "Aquabuster Saki" },
				{ id: "700", name: "Rabbit Satoru" },
			],
		},
		{
			rank: "B",
			cats: [
				{ id: "137", name: "Momotaro" },
				{ id: "632", name: "Yami" },
				{ id: "587", name: "Emperor" },
				{ id: "485", name: "Valkyrie Dark" },
				{ id: "620", name: "Lilin" },
				{ id: "135", name: "Gamereon" },
				{ id: "716", name: "Convoys" },
				{ id: "241", name: "Togeluga" },
				{ id: "450", name: "Jeanne" },
				{ id: "715", name: "Explorer Kanna" },
				{ id: "456", name: "Momoco" },
				{ id: "662", name: "Wedding Chronos" },
				{ id: "760", name: "Music Fest Thundia" },
				{ id: "571", name: "Nightmare" },
				{ id: "634", name: "Shitakiri" },
				{ id: "311", name: "Yuletide Nurse" },
				{ id: "506", name: "Gladios" },
				{ id: "503", name: "Myrcia" },
				{ id: "398", name: "Sakura Sonic" },
				{ id: "821", name: "Seaside Pegasa" },
				{ id: "648", name: "Terun" },
				{ id: "669", name: "Tengu" },
			],
		},
		{
			rank: "C+",
			cats: [
				{ id: "352", name: "Twinstars" },
				{ id: "213", name: "White Rabbit" },
				{ id: "276", name: "Midsummer Rabbit" },
				{ id: "635", name: "Cyclops" },
				{ id: "28", name: "Princess" },
				{ id: "331", name: "Springtime Kenshin" },
				{ id: "204", name: "Kachiyama" },
				{ id: "497", name: "Narita Kaihime" },
				{ id: "362", name: "Aer" },
				{ id: "738", name: "Floral Kalisa" },
				{ id: "402", name: "Voli" },
				{ id: "436", name: "Li'l Valkyrie" },
				{ id: "88", name: "Raiden" },
				{ id: "449", name: "Musashi Miyamoto" },
				{ id: "497", name: "Winter General Kaihime" },
				{ id: "588", name: "Chocoladite" },
				{ id: "258", name: "Zeus" },
				{ id: "726", name: "Ninja Girl Tomoe" },
				{ id: "755", name: "Akechi Mitsuhide" },
				{ id: "775", name: "Axel" },
				{ id: "782", name: "Mamoluga" },
			],
		},
		{
			rank: "C",
			cats: [
				{ id: "58", name: "Paladin" },
				{ id: "451", name: "Babel" },
				{ id: "170", name: "Kubiluga" },
				{ id: "462", name: "Legeluga" },
				{ id: "527", name: "Snow Angel Twinstars" },
				{ id: "359", name: "Verbena" },
				{ id: "74", name: "Oda Nobunaga" },
				{ id: "275", name: "Tropical Kalisa" },
				{ id: "84", name: "Sodom" },
				{ id: "86", name: "Vars" },
				{ id: "230", name: "Hallowindy" },
				{ id: "649", name: "Lovestruck" },
				{ id: "615", name: "Kaguya of the Coast" },
				{ id: "656", name: "Bliza" },
				{ id: "770", name: "Hanasaka" },
				{ id: "694", name: "Butler Vigler" },
				{ id: "825", name: "Sidmi" },
				{ id: "734", name: "Pegasa" },
			],
		},
		{
			rank: "D",
			cats: [
				{ id: "35", name: "Nekoluga" },
				{ id: "737", name: "Frozen Rose" },
				{ id: "596", name: "Blooming Kamukura" },
				{ id: "87", name: "Kamukura" },
				{ id: "144", name: "Nurse" },
				{ id: "242", name: "Frosty Kai" },
				{ id: "85", name: "Megidora" },
				{ id: "125", name: "Date Masamune" },
				{ id: "355", name: "Seashore Kai" },
				{ id: "428", name: "Cat Clan Heroes" },
				{ id: "231", name: "Spooky Thundia" },
				{ id: "720", name: "Tekachi" },
				{ id: "675", name: "Carrowsell" },
				{ id: "645", name: "Bittersweet Mekako" },
				{ id: "303", name: "Succubus" },
				{ id: "339", name: "Yoshimoto" },
				{ id: "437", name: "Nobiluga" },
				{ id: "688", name: "Reindeer Terun" },
				{ id: "773", name: "Pumpkin Sodom" },
				{ id: "667", name: "Night Beach Lilin" },
				{ id: "818", name: "Komori" },
			],
		},
		{
			rank: "F",
			cats: [
				{ id: "495", name: "Seabreeze Coppermine" },
				{ id: "712", name: "Betrothed Balaluga" },
				{ id: "589", name: "First-Love Myrcia" },
				{ id: "243", name: "Santa Kuu" },
				{ id: "244", name: "Holy Coppermine" },
				{ id: "439", name: "Waverider Kuu" },
				{ id: "565", name: "Summerluga" },
				{ id: "547", name: "Papaluga" },
			],
		},
	];

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<h1 className="text-4xl my-4">Tier list</h1>
			<table className="w-full border-collapse border border-gray-400">
				<thead>
					<tr>
						<th className="border border-gray-400 px-4 py-2">Rank</th>
						<th className="border border-gray-400 px-4 py-2">Cats</th>
					</tr>
				</thead>
				<tbody>
					{tiers.map((tier) => (
						<tr key={tier.rank}>
							<td className="border border-gray-400 px-4 py-2 align-top font-bold">
								{tier.rank}
							</td>
							<td className="border border-gray-400 px-4 py-2">
								<ul className="flex flex-wrap gap-4">
									{tier.cats.map((cat) => {
										const catFromDb = catDatabase?.cats[+cat.id];
										return (
											<li key={cat.name}>
												<TierCat
													catDatabase={catDatabase}
													cat={cat}
													onClick={() => {
														if (catFromDb) {
															setSelectedCat({
																id: cat.id,
																name: catFromDb.name,
																desc: catFromDb.desc,
																rarity: catFromDb.rarity,
															});
														}
													}}
												/>
											</li>
										);
									})}
								</ul>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<CatDialog
				selectedCat={selectedCat}
				onClose={() => setSelectedCat(null)}
			/>
		</div>
	);
}
