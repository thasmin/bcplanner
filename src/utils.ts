export function getCatStageImagePath(
	catId: string,
	stageIndex: number,
): string {
	const paddedId = catId.padStart(4, "0");
	return `/catImages/cat_${paddedId}_${stageIndex}.png`;
}
