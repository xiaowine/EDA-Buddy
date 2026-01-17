import type { DiffPairResult } from '../types/diffpair';
import type { Component, PassiveComponentPair, PassiveComponentWithPins } from '../types/netlist';

// 差分对定义
interface IPCB_DifferentialPairItem {
	name: string;
	positiveNet: string;
	negativeNet: string;
}

export const test = [
	'GND',
	'VBUS1',
	'+5V',
	'VBUS3',
	'3V3',
	'$5N107',
	'VBUS4',
	'VBUS5',
	'VBUS2',
	'1V2',
	'VBUS',
	'$1N1',
	'P111111111111111111111111111111111111111111111111111111_TX+',
	'$8N31',
	'P111111111111111111111111111111111111111111111111111111_TX-',
	'$8N32',
	'P3_TX+',
	'$8N25',
	'P3_TX-',
	'$8N26',
	'P4_TX+',
	'$8N45',
	'P4_TX-',
	'$8N46',
	'P2_TX-',
	'$8N24',
	'P2_TX+',
	'$8N23',
	'P2C_TX+',
	'$8N8',
	'P2C_TX-',
	'$8N7',
	'634_XI',
	'634_XO',
	'UP_C_TX+',
	'$6N12',
	'UP_C_TX-',
	'$6N11',
	'UP_TX-',
	'$6N8',
	'UP_TX+',
	'$6N7',
	'$5N48',
	'$5N109',
	'$5N104',
	'$5N106',
	'UP_C_RX+',
	'UP_C_RX-',
	'P1_RX-',
	'P1_RX+',
	'P4_RX-',
	'P4_RX+',
	'P3_RX-',
	'P3_RX+',
	'P2_RX-',
	'P2_RX+',
	'P2C_RX-',
	'P2C_RX+',
	'UP_RX+',
	'UP_RX-',
	'F_DP',
	'F_DM',
	'POWER_PG',
	'$1N103',
	'$1N102',
	'$5N145',
	'OVC1',
	'$5N156',
	'OVC2',
	'OVC3',
	'$5N174',
	'OVC4',
	'$5N192',
	'$5N76',
	'$5N99',
	'P4_DP',
	'P4_DM',
	'P3_DP',
	'P3_DM',
	'P2_DP',
	'P2_DM',
	'PWREN1',
	'PWREN2',
	'PWREN3',
	'PWREN4',
	'P2_CC2',
	'P2_CC1',
	'UP_CC2',
	'UP_CC1',
	'UP_DP',
	'UP_DM',
	'P1_DP',
	'P1_DM',
	'$6N1',
	'$5N166',
	'POWER_CC1',
	'POWER_DP',
	'POWER_DM',
	'POWER_CC2',
	'334_XO',
	'334_XI',
	'334_2_DM',
	'334_2_DP',
	'334_3_DM',
	'334_3_DP',
	'334_1_DM',
	'334_1_DP',
	'$5N226',
];

/**
 * 增强版差分对识别工具
 * @param netList - 所有的网络名称列表
 * @param existingPairs - 已经存在的差分对对象数组
 * @param positiveSuffixes - 正极后缀数组
 * @param negativeSuffixes - 负极后缀数组
 * @returns 包含重名差分对列表、正常差分对列表和已存在差分对的结果对象
 */
export function identifyNewDiffPairs(
	netList: string[],
	existingPairs: IPCB_DifferentialPairItem[] = [],
	positiveSuffixes: string[] = ['_P', '+', '_DP', 'P', '_H', '_DP', 'DP'],
	negativeSuffixes: string[] = ['_N', '-', '_DN', 'N', '_L', '_DM', 'DM'],
): DiffPairResult {
	// 动态构建正则表达式
	const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	// 规范化并按长度降序排序，保证最长后缀优先匹配
	const normalizeAndSort = (arr: string[]) => Array.from(new Set(arr.map((s) => s.toUpperCase().trim()))).sort((a, b) => b.length - a.length);

	const posSuffixesUpper = normalizeAndSort(positiveSuffixes);
	const negSuffixesUpper = normalizeAndSort(negativeSuffixes);

	// 用于构建正则（最长在前）
	const allSuffixesSorted = [...posSuffixesUpper, ...negSuffixesUpper];
	const suffixPattern: string = allSuffixesSorted.map(escapeRegex).join('|');

	// 预建查找 Set，减少运行时 toUpperCase 调用
	const posSuffixSet = new Set(posSuffixesUpper);
	const negSuffixSet = new Set(negSuffixesUpper);

	// 正则说明：^(主体名)(后缀)$  使用 'i' 忽略大小写
	const regex = new RegExp(`^(.+?)(${suffixPattern})$`, 'i');

	// --- 2. 查重缓存准备 ---
	const existingPairNames: Set<string> = new Set(existingPairs.map((p) => p.name));
	const occupiedNets: Set<string> = new Set();

	existingPairs.forEach((p) => {
		occupiedNets.add(p.positiveNet);
		occupiedNets.add(p.negativeNet);
	});

	const uniqueNetList: string[] = Array.from(new Set(netList));
	const potentialMap: Map<string, { origBase?: string; p?: string; n?: string }> = new Map();
	const normalPairs: IPCB_DifferentialPairItem[] = [];
	const duplicatedPairs: IPCB_DifferentialPairItem[] = [];

	// --- 3. 遍历并识别 ---
	uniqueNetList.forEach((net) => {
		if (!net || occupiedNets.has(net)) return;

		const match = net.match(regex);
		if (match) {
			const baseName = match[1];
			const suffix = match[2].toUpperCase();

			// 规范化 key，避免大小写差异分组
			const key = baseName.trim().toUpperCase();

			if (!potentialMap.has(key)) {
				potentialMap.set(key, { origBase: baseName });
			}

			const entry = potentialMap.get(key)!;

			// 使用预建 Set 快速判断正负
			const isPos = posSuffixSet.has(suffix);
			const isNeg = negSuffixSet.has(suffix);

			if (isPos) entry.p = net;
			else if (isNeg) entry.n = net;
		}
	});

	// --- 4. 冲突处理与组装 ---
	potentialMap.forEach((pair, key) => {
		if (pair.p && pair.n) {
			// 显示用名称优先使用首个原始形式，否则使用规范化 key
			const displayBase = pair.origBase ?? key;
			let finalName = displayBase;
			let starCount = 0;
			let isDuplicated = false;

			// 检查是否与已存在的差分对重名
			if (existingPairNames.has(finalName)) {
				isDuplicated = true;
				// 差分对名称查重逻辑：最多加 5 个 *
				while (existingPairNames.has(finalName)) {
					if (starCount < 5) {
						finalName += '*';
						starCount++;
					} else {
						// 达到上限，仍然记录为重名差分对
						finalName = displayBase + '*'.repeat(5);
						break;
					}
				}
			}

			const diffPair: IPCB_DifferentialPairItem = {
				name: finalName,
				positiveNet: pair.p,
				negativeNet: pair.n,
			};

			// 根据是否重名分类存储
			if (isDuplicated) {
				duplicatedPairs.push(diffPair);
			} else {
				normalPairs.push(diffPair);
			}

			// 更新缓存，防止本次识别出的对之间产生重名
			existingPairNames.add(finalName);
		}
	});

	return {
		duplicatedPairs,
		normalPairs,
		existingPairs,
	};
}

/**
 * 查找连接到差分对网络的未配对被动器件
 * 适用于USB、PCIe等场景，检测AC隔离电容/电阻的未配对情况
 * @param components - EasyEDA 网表中的 components 对象
 * @param existingPairs - 已存在的差分对列表
 */
export const findSingleNetPassivesByPairs = (
	components: Record<string, Component>,
	existingPairs: Array<IPCB_DifferentialPairItem>,
): PassiveComponentPair[] => {
	const result: PassiveComponentPair[] = [];
	if (!existingPairs || existingPairs.length === 0) {
		return result;
	}

	// 收集所有existingPairs的网络
	const existingNets = new Set<string>();
	existingPairs.forEach((p) => {
		existingNets.add(p.positiveNet);
		existingNets.add(p.negativeNet);
	});

	const allComponents = Object.values(components || {}) as Component[];

	existingPairs.forEach((diffPair) => {
		const posNet = diffPair.positiveNet;
		const negNet = diffPair.negativeNet;
		if (!posNet || !negNet) {
			return;
		}

		// 在正网络上查找单端器件
		const posPassives = filterSingleNetPassives(posNet, existingNets, allComponents);
		// 在负网络上查找单端器件
		const negPassives = filterSingleNetPassives(negNet, existingNets, allComponents);

		// 如果任一网络有未配对的器件，就记录为一个条目
		if (posPassives.length > 0 || negPassives.length > 0) {
			// 收集所有未配对器件另一端连接的网络
			const unpairedPosNets = new Set(posPassives.map((p) => p.otherNet) as string[]);
			const unpairedNegNets = new Set(negPassives.map((p) => p.otherNet) as string[]);

			// 收集器件位号
			const posDesignators = posPassives.map((p) => p.component.props.Designator);
			const negDesignators = negPassives.map((p) => p.component.props.Designator);

			result.push({
				differentialPairName: `${diffPair.name}*`,
				existingPositiveNet: posNet,
				existingNegativeNet: negNet,
				unpairedPositiveNet: unpairedPosNets.size > 0 ? Array.from(unpairedPosNets)[0] : undefined,
				unpairedNegativeNet: unpairedNegNets.size > 0 ? Array.from(unpairedNegNets)[0] : undefined,
				unpairedPositiveDesignators: posDesignators.length > 0 ? posDesignators : undefined,
				unpairedNegativeDesignators: negDesignators.length > 0 ? negDesignators : undefined,
				matchReason: 'unpaired',
			});
		}
	});

	if (result.length > 0) {
		console.log(`[findSingleNetPassivesByPairs] 完成，共找到 ${result.length} 个未配对网络`);
	}

	return result;
};

/**
 * 筛选连接到指定网络的单端器件（电阻或电容）
 * 条件：只有2个pin，其中1个连接到指定网络，另1个不连接到existingNets中的任何网络
 */
const filterSingleNetPassives = (netName: string, existingNets: Set<string>, allComponents: Component[]): PassiveComponentWithPins[] => {
	const list: PassiveComponentWithPins[] = [];

	allComponents.forEach((component) => {
		const designator = component?.props?.Designator;

		// 只查找电容或电阻（C或R开头）
		if (!designator) return;
		const firstChar = designator.trim().charAt(0).toUpperCase();
		if (firstChar !== 'C' && firstChar !== 'R') return;

		const pinInfoMap: Record<string, any> = component.pinInfoMap || {};
		const totalPins = Object.values(pinInfoMap).length;

		// 只处理2pin的器件
		if (totalPins !== 2) {
			return;
		}

		const pins = Object.values(pinInfoMap) as any[];
		const connectedToNet = pins.filter((p) => p?.net === netName);
		const otherPin = pins.find((p) => p?.net !== netName);

		// 必须只有1个pin连接到指定网络
		if (connectedToNet.length !== 1 || !otherPin) {
			return;
		}

		const otherNetName = otherPin.net;

		// 另一个pin必须有网络标签
		if (!otherNetName) {
			return;
		}

		// 另一个pin不能连接到existingNets中的任何网络
		if (existingNets.has(otherNetName)) {
			return;
		}

		list.push({
			component,
			pins: [connectedToNet[0].number || connectedToNet[0].name || ''],
			otherNet: otherNetName, // 保存另一端的网络
		});
	});

	return list;
};
