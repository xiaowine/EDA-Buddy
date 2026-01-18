// helper: create resistor by LCSC and attach label nets to its first N pins
const createResNet = async (lcscId, libraryUuid, x, y, labelNames = ['CC1', 'GND'], rotations = [0, 180]) => {
	const devices = await eda.lib_Device.getByLcscIds([lcscId], undefined, false);
	const uuid = devices?.[0]?.uuid;
	if (!uuid) {
		console.log('Failed to find resistor LCSC ID: ' + lcscId, 'error');
		return null;
	}

	const component = await eda.sch_PrimitiveComponent.create({ libraryUuid, uuid }, x, y);
	if (!component) {
		console.log('Failed to create component LCSC ID: ' + lcscId, 'error');
		return null;
	}

	const primitiveId = component.getState_PrimitiveId();
	const pins = (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId)) ?? [];
	console.log('Created resistor LCSC ID: ' + lcscId + ' with Primitive ID:', primitiveId, pins);

	// attach label nets to the first labelNames.length pins
	await Promise.all(
		pins.slice(0, labelNames.length).map(async (pin, idx) => {
			let pinName = pin.getState_PinName();
			if (pinName === 'SHELL') pinName = 'GND';
			if (pinName?.includes('SUB')) return;

			const px = pin.getState_X();
			const py = pin.getState_Y();
			const rot = rotations[idx] ?? 180 - pin.getState_Rotation();
			const labelName = labelNames[idx] ?? pinName;

			const [net, line] = await Promise.all([
				eda.sch_PrimitiveComponent.createNetPort('IN', labelName, px, py, rot),
				eda.sch_PrimitiveWire.create([px, py, px, py]),
			]);
			console.log('Created LabelNet:', labelName, 'at', px, py, 'rotation:', rot, 'NetPort:', net, 'Wire:', line);
		}),
	);

	return component;
};

const test = async () => {
	const [libraryUuid, devices] = await Promise.all([
		eda.lib_LibrariesList.getSystemLibraryUuid(),
		eda.lib_Device.getByLcscIds(['C2765186'], undefined, false),
	]);

	const uuid = devices?.[0]?.uuid;
	if (!libraryUuid || !uuid) {
		console.log('Failed to find component LCSC ID: C2765186', 'error');
		return;
	}

	const component = await eda.sch_PrimitiveComponent.create({ libraryUuid, uuid }, -100, -100);
	if (!component) {
		console.log('Failed to create component LCSC ID: C2765186', 'error');
		return;
	}

	const primitiveId = component.getState_PrimitiveId();

	const allPins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId);
	console.log('Created component LCSC ID: C2765186 with Primitive ID:', primitiveId, allPins);

	const primitiveIds = [primitiveId];
	await Promise.all(
		allPins?.map(async (pin) => {
			let pinName = pin.getState_PinName();
			if (pinName === 'SHELL') {
				pinName = 'GND';
			} else if (pinName?.includes('SBU')) {
				return;
			} else if (pinName?.includes('DP')) {
				pinName = 'DP';
			} else if (pinName?.includes('DN')) {
				pinName = 'DM';
			}
			console.log('Processing pin:', pinName);
			const x = pin.getState_X();
			const y = pin.getState_Y();
			const rotation = 180 - pin.getState_Rotation();

			const [net, line] = await Promise.all([
				eda.sch_PrimitiveComponent.createNetPort('IN', pinName, x, y, rotation),
				eda.sch_PrimitiveWire.create([x, y, x, y]),
			]);
			const netPrimitiveId = net?.getState_PrimitiveId();
			if (netPrimitiveId) {
				primitiveIds.push(netPrimitiveId);
			}
			console.log('Created NetPort:', pinName, 'at', x, y, 'rotation:', rotation, 'NetPort:', net, 'Wire:', line);
		}) ?? [],
	);

	// 获取符号区域
	const bbox = await eda.sch_Primitive.getPrimitivesBBox(primitiveIds);
	console.log('bbox', bbox);

	const x = (bbox.maxX + bbox.minX) / 2;
	const y = bbox.maxY - 50;
	const a = await createResNet('C23186', libraryUuid, x, y, ['CC1', 'GND'], [180, 0]);
	const b = await createResNet('C23186', libraryUuid, x, y - 50, ['CC2', 'GND'], [180, 0]);

	const netPrimitiveId1 = a?.getState_PrimitiveId();
	if (netPrimitiveId1) {
		primitiveIds.push(netPrimitiveId1);
	}
	const netPrimitiveId2 = b?.getState_PrimitiveId();
	if (netPrimitiveId2) {
		primitiveIds.push(netPrimitiveId2);
	}

	// 获取符号区域
	const bbox1 = await eda.sch_Primitive.getPrimitivesBBox(primitiveIds);
	console.log('bbox1', bbox1);
	eda.dmt_EditorControl.zoomToRegion(bbox1.minX - 100, bbox1.maxX + 100, bbox1.minX + 100, bbox1.maxY);
	console.log(bbox1.minX - 100, bbox1.maxX + 100, bbox1.minX - 50, bbox1.maxY + 50);
};

eda.sys_LoadingAndProgressBar.showLoading();
await test().catch((err) => {
	console.error('Test script failed:', err);
});
eda.sys_LoadingAndProgressBar.destroyLoading();
