import type { PlaceTwoEndedResult } from './oneclickplace';

/** 常量：单位换算 */
export const MIL_TO_MM = 0.0254; // 1 mil = 0.0254 mm
export const MM_TO_MIL = 39.37007874015748; // 1 mm = 39.37007874015748 mil
export const isEDA = typeof window !== 'undefined' && (window as any).eda !== undefined;

const getCurrentDocumentType = async (): Promise<EDMT_EditorDocumentType | null | undefined> => {
	if (!isEDA) return null;
	const info = await eda.dmt_SelectControl.getCurrentDocumentInfo();
	return info?.documentType;
};

export const isSCH = async () => {
	try {
		const docType = await getCurrentDocumentType();
		return docType === EDMT_EditorDocumentType.SCHEMATIC_PAGE;
	} catch {
		return false;
	}
};

export const isPCB = async () => {
	try {
		const docType = await getCurrentDocumentType();
		return docType === EDMT_EditorDocumentType.PCB;
	} catch {
		return false;
	}
};

/**
 * 将移动组件移动到与固定组件指定引脚对齐并创建连线（支持垂直/水平对齐）
 * moving: 要移动的放置结果
 * fixed: 基准（不移动）的放置结果
 * movingPosition/fixedPosition: 'top'|'bottom'|'left'|'right'
 */
export const alignAndConnectComponents = async (
	moving: PlaceTwoEndedResult,
	fixed: PlaceTwoEndedResult,
	movingPosition: 'top' | 'bottom' | 'left' | 'right',
	fixedPosition: 'top' | 'bottom' | 'left' | 'right',
): Promise<boolean> => {
	try {
		const movingPins = moving.pins || [];
		const fixedPins = fixed.pins || [];
		if (!movingPins.length || !fixedPins.length) {
			console.error('组件引脚信息不完整，无法对齐');
			if (isEDA) eda.sys_Message.showToastMessage('组件引脚信息不完整，无法对齐', ESYS_ToastMessageType.ERROR, 5);
			return false;
		}

		const pickPin = (pins: Array<any>, pos: 'top' | 'bottom' | 'left' | 'right') => {
			if (pos === 'top') return pins.reduce((p, c) => (p.y <= c.y ? p : c));
			if (pos === 'bottom') return pins.reduce((p, c) => (p.y >= c.y ? p : c));
			if (pos === 'left') return pins.reduce((p, c) => (p.x <= c.x ? p : c));
			return pins.reduce((p, c) => (p.x >= c.x ? p : c));
		};

		const fixedPin = pickPin(fixedPins, fixedPosition);
		const movingPin = pickPin(movingPins, movingPosition);

		const baseX = moving.component!.getState_X();
		const baseY = moving.component!.getState_Y();
		const newX = baseX + (fixedPin.x - movingPin.x);
		const newY = baseY + (fixedPin.y - movingPin.y);

		await eda.sch_PrimitiveComponent.modify(moving.component!.getState_PrimitiveId(), {
			...moving.component,
			x: newX,
			y: newY,
		});

		const deltaX = newX - baseX;
		const deltaY = newY - baseY;
		const movedPinX = movingPin.x + deltaX;
		const movedPinY = movingPin.y + deltaY;

		await eda.sch_PrimitiveWire.create([fixedPin.x, fixedPin.y, movedPinX, movedPinY]);

		eda.sch_SelectControl.doSelectPrimitives([...moving.primitiveIds, ...fixed.primitiveIds]);
		return true;
	} catch (err) {
		console.error('对齐并连接组件时出错', err);
		if (isEDA) eda.sys_Message.showToastMessage('对齐并连接组件时发生错误', ESYS_ToastMessageType.ERROR, 5);
		return false;
	}
};
