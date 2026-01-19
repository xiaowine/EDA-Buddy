import type { NET, NetFLAG } from '../types/oneclickplace';
import { NetPort } from '../types/oneclickplace';

export interface PlaceTwoEndedResult {
	component: ISCH_PrimitiveComponent | ISCH_PrimitiveComponent_2 | null;
	pins: { x: number; y: number; name: string; rotation: number }[];
	bbox: { minX: number; minY: number; maxX: number; maxY: number } | null;
	primitiveIds: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const placeTwoEndedComponent = async (
	lcscId: string,
	libraryUuid: string,
	x: number,
	y: number,
	rotation: number,
	net_pins: NET[] | null,
): Promise<PlaceTwoEndedResult> => {
	const devices = await eda.lib_Device.getByLcscIds([lcscId], undefined, false);
	if (devices.length !== 1) {
		console.error(`找不到电阻 LCSC ID：${lcscId}`);
		return { component: null, pins: [], bbox: null, primitiveIds: [] };
	}
	const uuid = devices[0].uuid;

	const component = await eda.sch_PrimitiveComponent.create({ libraryUuid, uuid }, x, y, undefined, rotation);
	if (!component) {
		console.error(`创建器件失败，LCSC ID：${lcscId}`);
		return { component: null, pins: [], bbox: null, primitiveIds: [] };
	}

	const primitiveId = component.getState_PrimitiveId();
	const pins = (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId)) ?? [];
	const primitiveIds: string[] = [];
	if (primitiveId) primitiveIds.push(primitiveId);

	// 要求 net_pins 和 pins 数量相等且为 2，否则直接返回（前提是net_pins不是null，如果是null则忽略）
	// if (!(net_pins && net_pins!.length === pins.length && pins.length === 2)) {
	// 	console.warn(`labelNames 与 pins 数量必须相等且为 2，当前：labelNames=${net_pins?.length}, pins=${pins.length}, lcscId=${lcscId}`);
	// 	return { component, pins: [], bbox: null };
	// }
	console.info(`已创建电阻，LCSC ID：${lcscId}，Primitive ID：${primitiveId}`);

	const pinsInfo = await Promise.all(
		pins.map(async (pin, idx) => {
			try {
				const pinName = pin.getState_PinName();
				const px = pin.getState_X();
				const py = pin.getState_Y();
				if (net_pins && net_pins!.length === pins.length && pins.length === 2) {
					const labelName = net_pins[idx]?.name ?? pinName;
					const rot = 180 - rotation - pin.getState_Rotation();
					const t = net_pins[idx].type;
					const isPort = t ? Object.values(NetPort).includes(t as NetPort) : false;
					if (isPort) {
						const created = await eda.sch_PrimitiveComponent.createNetPort(t as NetPort, labelName, px, py, rot);
						const createdId = created!.getState_PrimitiveId()!;
						primitiveIds.push(createdId);
					} else {
						const created = await eda.sch_PrimitiveComponent.createNetFlag(t as NetFLAG, labelName, px, py, rot);
						const createdId = created!.getState_PrimitiveId()!;
						primitiveIds.push(createdId);
					}

					await eda.sch_PrimitiveWire.create([px, py, px, py]);
					console.info(`已创建标签网：${labelName}，位置：(${px}, ${py})，旋转：${rot}`);
					return { x: px, y: py, name: labelName, rotation: rot };
				} else {
					return { x: px, y: py, name: pinName, rotation: pin.getState_Rotation() };
				}
			} catch (err) {
				console.error(`创建标签网失败，索引：${idx}，lcscId：${lcscId}`, err);
				return { x: 0, y: 0, name: '', rotation: 0 };
			}
		}),
	);

	const bbox = await eda.sch_Primitive.getPrimitivesBBox(primitiveIds);
	return { component, pins: pinsInfo, bbox: bbox ?? null, primitiveIds: primitiveIds };
};

export const zoom = async (primitiveIds: string[]) => {
	const bbox = await eda.sch_Primitive.getPrimitivesBBox(primitiveIds);
	if (bbox) {
		// 使用与 zoomToBBoxes 相同的边距并保证参数顺序为 (left, right, top, bottom)
		const padding = 50;
		const left = bbox!.minX - padding;
		const right = bbox!.maxX + padding;
		const top = bbox!.maxY + padding;
		const bottom = bbox!.minY - padding;
		eda.dmt_EditorControl.zoomToRegion(left, right, top, bottom);
		console.log('已缩放到指定元件区域', { left, right, top, bottom });
	} else {
		console.log('无法获取指定元件的边界框，无法缩放');
	}
};

/**
 * 合并一组 bbox 并缩放到该区域。
 * @param bboxes - 数组，元素为 { minX, minY, maxX, maxY }
 * @param padding - 缩放时的额外边距，默认 50
 */
export const zoomToBBoxes = (bboxes: Array<{ minX: number; minY: number; maxX: number; maxY: number }>, padding = 50) => {
	if (!bboxes || bboxes.length === 0) {
		console.warn('zoomToBBoxes: 未提供 bbox 列表');
		return;
	}

	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const b of bboxes) {
		if (typeof b.minX === 'number') minX = Math.min(minX, b.minX);
		if (typeof b.minY === 'number') minY = Math.min(minY, b.minY);
		if (typeof b.maxX === 'number') maxX = Math.max(maxX, b.maxX);
		if (typeof b.maxY === 'number') maxY = Math.max(maxY, b.maxY);
	}

	if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
		console.warn('zoomToBBoxes: 计算到无效的 bbox');
		return;
	}

	const width = Math.max(1, maxX - minX);
	const height = Math.max(1, maxY - minY);
	const size = Math.max(width, height);

	const outMinX = minX - padding;
	const outMinY = minY - padding;
	const outMaxX = maxX + padding;
	const outMaxY = maxY + padding;

	try {
		eda.dmt_EditorControl.zoomToRegion(outMinX, outMaxX, outMaxY, outMinY);
		console.log('已缩放到合并区域', { minX, minY, maxX, maxY, size, padding });
	} catch (err) {
		console.error('zoomToBBoxes: 调用缩放失败', err);
	}
};
