import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type CatDatabase, loadCatDatabase } from "@/data/gacha-data";

export const Route = createFileRoute("/tierlist")({
	component: RouteComponent,
});

const TierCat: React.FC<{
	catDatabase?: CatDatabase;
	cat: { id: string; name: string };
}> = ({ catDatabase, cat }) => {
	const db = Object.entries(catDatabase?.cats ?? {}).filter((entry) =>
		entry[1].name.some((name) =>
			name.toLowerCase().includes(cat.name.toLowerCase()),
		),
	);

	if (cat.id) {
		const catFromDb = catDatabase?.cats[parseInt(cat.id, 10)];
		if (catFromDb) {
			return (
				<>
					known: {cat.id}: {catFromDb.name[0]}
				</>
			);
		}
	}

	if (db.length === 1)
		return (
			<>
				replace: {db[0][0]}: {db[0][1].name[0]}
			</>
		);

	if (db.length > 0)
		return (
			<>
				choose: {db.map((d) => `${d[0]}: ${d[1].name.join(",")}`).join(" | ")}
			</>
		);

	return (
		<>
			unknown: {cat.id}: {cat.name}
			{!cat.id &&
				(db
					? `(DB ID: ${db.map((d) => `${d[0]} - ${d[1].name.join(",")}`)})`
					: "(Not found in DB)")}
		</>
	);
};

function RouteComponent() {
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
				{ id: "544", name: "Kasli the Bane" },
				{ id: "442", name: "D'arktanyan" },
				{ id: "26", name: "Awakened Bahamut" },
				{ id: "272", name: "Amaterasu" },
				{ id: "334", name: "Shadow Gao" },
				{ id: "319", name: "Mitama the Oracle" },
				{ id: "171", name: "Lufalan Pasalan" },
				{ id: "136", name: "Cosmo" },
				{ id: "138", name: "Kasa Jizo" },
				{ id: "691", name: "Phono" },
			],
		},
		{
			rank: "S+",
			cats: [
				{ id: "610", name: "Garu, Prince of Darkness" },
				{ id: "662", name: "Chronos the Bride" },
				{ id: "381", name: "D'artanyan" },
				{ id: "732", name: "Izanagi" },
				{ id: "270", name: "Mighty Lord Gao" },
				{ id: "587", name: "Emperor Cat" },
				{ id: "479", name: "Lumina" },
				{ id: "642", name: "Iz the Dancer" },
				{ id: "658", name: "Iz the Dancer of Grief" },
				{ id: "620", name: "Lilin" },
			],
		},
		{
			rank: "S",
			cats: [
				{ id: "169", name: "Uesugi Kenshin" },
				{ id: "323", name: "Sarukani" },
				{ id: "573", name: "Balrog" },
				{ id: "77", name: "Thundia" },
				{ id: "449", name: "Musashi Miyamoto" },
				{ id: "175", name: "Mola" },
				{ id: "534", name: "Saki" },
				{ id: "273", name: "Splendid Ganesha" },
				{ id: "621", name: "Hevijak" },
			],
		},
		{
			rank: "A+",
			cats: [
				{ id: "197", name: "Catman" },
				{ id: "262", name: "Hayabusa" },
				{ id: "526", name: "Kintaro" },
				{ id: "137", name: "Momotaro" },
				{ id: "440", name: "Empress Chronos" },
				{ id: "125", name: "Date Masamune" },
				{ id: "227", name: "Warlock" },
				{ id: "503", name: "Myrcia" },
				{ id: "73", name: "Maeda Keiji" },
				{ id: "86", name: "Vars" },
				{ id: "88", name: "Raiden" },
				{ id: "535", name: "Hades" },
				{ id: "432", name: "Gravicci" },
				{ id: "319", name: "Miko Mitama" },
				{ id: "260", name: "Aphrodite" },
				{ id: "335", name: "Himeyuri" },
				{ id: "379", name: "Gothic Mitama" },
				{ id: "713", name: "Kaoluga" },
				{ id: "284", name: "Pai-Pai" },
				{ id: "87", name: "Kamukura" },
				{ id: "169", name: "Asiluga" },
				{ id: "107", name: "Kai" },
			],
		},
		{
			rank: "A",
			cats: [
				{ id: "60", name: "Cats in the Cradle" },
				{ id: "44", name: "Cat Machine" },
				{ id: "204", name: "Kachi-Kachi" },
				{ id: "456", name: "Wonder MOMOCO" },
				{ id: "450", name: "Headmistress Jeanne" },
				{ id: "418", name: "Thermae D-Lux" },
				{ id: "213", name: "The White Rabbit" },
				{ id: "160", name: "Kalisa" },
				{ id: "259", name: "Anubis" },
				{ id: "352", name: "Twinstars" },
				{ id: "317", name: "Poseidon" },
				{ id: "402", name: "Voli" },
				{ id: "482", name: "Doktor Heaven" },
				{ id: "258", name: "Zeus" },
				{ id: "131", name: "Ururun Cat" },
				{ id: "437", name: "Nobiluga" },
				{ id: "464", name: "Pandora" },
				{ id: "336", name: "Sea Maiden Ruri" },
				{ id: "195", name: "Akira" },
				{ id: "565", name: "Summerluga" },
				{ id: "452", name: "Ushiwakamaru" },
				{ id: "170", name: "Kubiluga" },
			],
		},
		{
			rank: "B+",
			cats: [
				{ id: "74", name: "Oda Nobunaga" },
				{ id: "126", name: "Takeda Shingen" },
				{ id: "661", name: "Daliasan" },
				{ id: "106", name: "Kuu" },
				{ id: "339", name: "Imagawa Yoshimoto" },
				{ id: "108", name: "Coppermine" },
				{ id: "72", name: "Sanada Yukimura" },
				{ id: "362", name: "Aer" },
				{ id: "84", name: "Sodom" },
				{ id: "337", name: "Reika" },
				{ id: "643", name: "Lucifer" },
				{ id: "687", name: "Sirius" },
				{ id: "303", name: "Lilith Cat" },
				{ id: "35", name: "Nekoluga" },
			],
		},
		{
			rank: "B",
			cats: [
				{ id: "397", name: "Ganglion" },
				{ id: "359", name: "Graveflower Verbena" },
				{ id: "159", name: "Uesugi Kenshin" },
				{ id: "85", name: "Megidora" },
				{ id: "171", name: "Tecoluga" },
				{ id: "260", name: "Radiant Aphrodite" },
				{ id: "545", name: "Kyosaka Nanaho" },
				{ id: "287", name: "Strike Unit R.E.I." },
				{ id: "307", name: "Bomburr" },
				{ id: "615", name: "Kaguya" },
				{ id: "178", name: "Dioramos" },
				{ id: "428", name: "Cat Clan Heroes" },
				{ id: "241", name: "Shishilan Pasalan" },
				{ id: "139", name: "Princess Kaguya" },
				{ id: "126", name: "Takeda Shingen" },
				{ id: "125", name: "Date Masamune" },
				{ id: "713", name: "Kaoluga" },
				{ id: "169", name: "Asiluga" },
				{ id: "230", name: "Hallowindy" },
				{ id: "", name: "Easter Kanna" },
				{ id: "596", name: "Kamukura" },
				{ id: "242", name: "Frosty Kai" },
				{ id: "432", name: "butler" },
				{ id: "227", name: "Klay" },
			],
		},
		{
			rank: "C+",
			cats: [
				{ id: "", name: "Trickster Himeyuri" },
				{ id: "", name: "Wolfchild Deale" },
				{ id: "", name: "Nozomu" },
				{ id: "", name: "Detective Vigler" },
				{ id: "", name: "Legeluga" },
				{ id: "", name: "Mighty Kristul Mu (Legend Rare)" },
				{ id: "", name: "God-Emperor Sodom" },
				{ id: "", name: "Midsummer Rabbit" },
				{ id: "", name: "Santa Kuu" },
				{ id: "", name: "Santa Kanna" },
				{ id: "", name: "Thunder God Saki" },
				{ id: "", name: "Sharpshooter Saki" },
				{ id: "", name: "Himeyuri" },
				{ id: "", name: "Kanna" },
				{ id: "", name: "Deale" },
				{ id: "", name: "Vigler" },
			],
		},
		{
			rank: "C",
			cats: [
				{ id: "", name: "Princess Kaguya" },
				{ id: "", name: "Kachi-Kachi" },
				{ id: "", name: "Momotaro" },
				{ id: "", name: "Sarukani" },
				{ id: "", name: "Kintaro" },
				{ id: "", name: "Akira" },
				{ id: "", name: "Hayabusa" },
				{ id: "", name: "Catman" },
				{ id: "", name: "Raiden" },
				{ id: "", name: "Vars" },
				{ id: "", name: "Kai" },
				{ id: "", name: "Kuu" },
				{ id: "", name: "Coppermine" },
				{ id: "", name: "Kalisa" },
				{ id: "", name: "The White Rabbit" },
				{ id: "", name: "Thundia" },
				{ id: "", name: "Megidora" },
				{ id: "", name: "Sodom" },
				{ id: "", name: "Uesugi Kenshin" },
				{ id: "", name: "Takeda Shingen" },
				{ id: "", name: "Date Masamune" },
				{ id: "", name: "Imagawa Yoshimoto" },
				{ id: "", name: "Oda Nobunaga" },
				{ id: "", name: "Sanada Yukimura" },
				{ id: "", name: "Maeda Keiji" },
				{ id: "", name: "Anubis" },
				{ id: "", name: "Zeus" },
				{ id: "", name: "Aphrodite" },
				{ id: "", name: "Amaterasu" },
				{ id: "", name: "Poseidon" },
				{ id: "", name: "Hades" },
				{ id: "", name: "Giga-Volt" },
				{ id: "", name: "Chronos" },
				{ id: "", name: "Cat Clan Heroes" },
				{ id: "", name: "Dioramos" },
				{ id: "", name: "Kaguya" },
				{ id: "", name: "Bomburr" },
				{ id: "", name: "Reika" },
				{ id: "", name: "Aer" },
				{ id: "", name: "Sirius" },
				{ id: "", name: "Lilith Cat" },
				{ id: "", name: "Lucifer" },
			],
		},
		{
			rank: "D",
			cats: [
				{ id: "", name: "Balaluga" },
				{ id: "", name: "Togeluga" },
				{ id: "", name: "Kubiluga" },
				{ id: "", name: "Asiluga" },
				{ id: "", name: "Nekoluga" },
				{ id: "", name: "Nobiluga" },
				{ id: "", name: "Kaoluga" },
				{ id: "", name: "Shishilan Pasalan" },
				{ id: "", name: "Lufalan Pasalan" },
				{ id: "", name: "Legeluga" },
				{ id: "", name: "Togelan Pasalan" },
				{ id: "", name: "Furiluga" },
				{ id: "", name: "Papaluga" },
				{ id: "", name: "Tecoluga" },
			],
		},
	];

	return (
		<div className="p-4 max-w-7xl mx-auto">
			<h1 className="text-4xl">Tier list (in progress)</h1>
			<table className="w-full border-collapse border border-gray-400 opacity-30">
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
								<ul className="list-disc list-inside">
									{tier.cats.map((cat) => (
										<li key={cat.name}>
											<TierCat catDatabase={catDatabase} cat={cat} />
										</li>
									))}
								</ul>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
