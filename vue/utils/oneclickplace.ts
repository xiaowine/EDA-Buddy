import type { NET, NetFLAG } from '../types/oneclickplace';
import { NetPort } from '../types/oneclickplace';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createResistor = async (
	lcscId: string,
	libraryUuid: string,
	x: number,
	y: number,
	rotation: number,
	net_pins: NET[],
): Promise<ISCH_PrimitiveComponent | ISCH_PrimitiveComponent_2 | null> => {
	const devices = await eda.lib_Device.getByLcscIds([lcscId], undefined, false);
	if (devices.length !== 1) {
		console.error(`找不到电阻 LCSC ID：${lcscId}`);
		return null;
	}
	const uuid = devices[0].uuid;

	const component = await eda.sch_PrimitiveComponent.create({ libraryUuid, uuid }, x, y, undefined, rotation);
	if (!component) {
		console.error(`创建器件失败，LCSC ID：${lcscId}`);
		return null;
	}

	const primitiveId = component.getState_PrimitiveId();
	const pins = (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(primitiveId)) ?? [];
	// 要求 labelNames 和 pins 数量相等且为 2，否则直接返回 null
	if (net_pins.length !== pins.length || pins.length !== 2) {
		console.warn(`labelNames 与 pins 数量必须相等且为 2，当前：labelNames=${net_pins.length}, pins=${pins.length}, lcscId=${lcscId}`);
		return null;
	}
	console.info(`已创建电阻，LCSC ID：${lcscId}，Primitive ID：${primitiveId}`);

	await Promise.all(
		pins.map(async (pin, idx) => {
			try {
				const pinName = pin.getState_PinName();
				const px = pin.getState_X();
				const py = pin.getState_Y();
				const rot = 180 - pin.getState_Rotation();
				const labelName = net_pins[idx]?.name ?? pinName;
				let net: ISCH_PrimitiveComponent | ISCH_PrimitiveComponent_2 | undefined;
				const t = net_pins[idx].type;
				const isPort = t ? Object.values(NetPort).includes(t as NetPort) : false;
				if (isPort) {
					net = await eda.sch_PrimitiveComponent.createNetPort(t as NetPort, labelName, px, py, rot);
				} else {
					net = await eda.sch_PrimitiveComponent.createNetFlag(t as NetFLAG, labelName, px, py, rot);
				}

				const line = await eda.sch_PrimitiveWire.create([px, py, px, py]);
				console.info(`已创建标签网：${labelName}，位置：(${px}, ${py})，旋转：${rot}`);
				console.debug('网端口:', net, '连线:', line);
			} catch (err) {
				console.error(`创建标签网失败，索引：${idx}，lcscId：${lcscId}`, err);
			}
		}),
	);

	return component;
};

export const zoom = async (primitiveIds: string[]) => {
	const bbox = await eda.sch_Primitive.getPrimitivesBBox(primitiveIds);
	if (bbox) {
		eda.dmt_EditorControl.zoomToRegion(bbox!.minX - 50, bbox!.maxX + 50, bbox!.minX, bbox!.maxY);
		console.log('已缩放到指定元件区域', bbox);
	} else {
		console.log('无法获取指定元件的边界框，无法缩放');
	}
};
