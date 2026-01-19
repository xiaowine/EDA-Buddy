import { NetPort } from './oneclickplace';

export type USBGender = 'female' | 'male';
export type USBMountType = 'through' | 'smd';
export type USBVersion = 'usb2' | 'usb3';

export interface UsbVariantEntry {
	lcsc: string; // LCSC 编号，例如 "C2765186"
	label: string; // 显示文本
}

// 结构：mountType -> version -> gender -> UsbVariantEntry[]
export const usbVariantMap: Record<USBMountType, Record<USBVersion, Record<USBGender, UsbVariantEntry[]>>> = {
	through: {
		usb2: {
			// 母座
			female: [
				{ lcsc: 'C456015', label: '直插' },
				{ lcsc: 'C456018', label: '弯插' },
			],
			// 公头
			male: [{ lcsc: 'C404965', label: '弯插' }],
		},
		usb3: {
			female: [
				{ lcsc: 'C7501847', label: '侧插' },
				{ lcsc: 'C2845330', label: '弯插' },
				{ lcsc: 'C2845339', label: '直插' },
			],
			male: [],
		},
	},
	smd: {
		usb2: {
			female: [
				{ lcsc: 'C668591', label: '短体卧贴' },
				{ lcsc: 'C530628', label: '沉板' },
			],
			male: [{ lcsc: 'C720521', label: '卧贴' }],
		},
		usb3: {
			female: [{ lcsc: 'C7501863', label: '沉板' }],
			male: [{ lcsc: 'C7501854', label: '沉板' }],
		},
	},
};

/**
 * 为连接器的引脚创建 NetPort/NetFlag 和零长度连线，返回创建的 primitiveIds 列表
 * @param pins 引脚信息数组，包含 { x, y, name, rotation }
 */
export const createConnectorPinNets = async (pins: Array<{ x: number; y: number; name: string; rotation: number }>): Promise<string[]> => {
	const primitiveIds: string[] = [];
	await Promise.all(
		pins.map(async (pin) => {
			try {
				let pinName = pin.name;
				if (pinName?.includes('SH') || pinName?.includes('GND') || pinName?.includes('MH') || /^\d+$/.test(pinName)) {
					pinName = 'GND';
				} else if (pinName?.includes('SBU')) {
					return;
				} else if (pinName?.includes('DP')) {
					pinName = 'DP';
				} else if (pinName?.includes('DN') || pinName?.includes('DM')) {
					pinName = 'DM';
				} else if (pinName?.includes('VCC')) {
					pinName = 'VBUS';
				}

				const x = pin.x;
				const y = pin.y;
				const rotation = 180 - pin.rotation;

				const created = await eda.sch_PrimitiveComponent.createNetPort(NetPort.IN, pinName, x, y, rotation);
				const createdId = created?.getState_PrimitiveId();
				if (createdId) primitiveIds.push(createdId);

				await eda.sch_PrimitiveWire.create([x, y, x, y]);
			} catch (err) {
				console.error('createConnectorPinNets: 创建引脚网失败', err);
			}
		}),
	);
	return primitiveIds;
};
