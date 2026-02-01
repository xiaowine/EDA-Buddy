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
	positiveSuffixes: string[] = ['P', '+', 'DP', 'H', 'DP'],
	negativeSuffixes: string[] = ['N', '-', 'DN', 'L', 'DM'],
): DiffPairResult {
	// 参考 identifyDiffPairsSimple 的后缀匹配策略：后缀可在任意位置出现，
	// 但后缀之后必须是字符串结尾或非字母数字字符；优先匹配最长后缀。
	const normalizeAndSort = (arr: string[]) =>
		Array.from(new Set(arr.map((s) => (s || '').toUpperCase().trim()))).sort((a, b) => b.length - a.length);

	const posSuffixesUpper = normalizeAndSort(positiveSuffixes);
	const negSuffixesUpper = normalizeAndSort(negativeSuffixes);

	// const posSuffixSet = new Set(posSuffixesUpper);
	// const negSuffixSet = new Set(negSuffixesUpper);

	// --- 2. 查重缓存准备 ---
	const existingPairNames: Set<string> = new Set(existingPairs.map((p) => p.name));
	const occupiedNets: Set<string> = new Set();

	existingPairs.forEach((p) => {
		occupiedNets.add(p.positiveNet);
		occupiedNets.add(p.negativeNet);
	});

	const uniqueNetList: string[] = Array.from(new Set(netList)).filter(Boolean);
	const potentialMap: Map<string, { origBase?: string; p?: string; n?: string }> = new Map();
	const normalPairs: IPCB_DifferentialPairItem[] = [];
	const duplicatedPairs: IPCB_DifferentialPairItem[] = [];

	// 查找后缀在字符串中的出现（要求后缀后为字符串结尾或非字母数字）
	const findSuffixOccurrence = (netU: string, suffixes: string[]) => {
		for (const s of suffixes) {
			if (!s) continue;
			let start = 0;
			while (true) {
				const idx = netU.indexOf(s, start);
				if (idx === -1) break;
				const after = idx + s.length;
				const afterChar = after < netU.length ? netU.charAt(after) : '';
				const afterOk = after >= netU.length || !/[A-Z0-9]/i.test(afterChar);
				if (afterOk) return { suffix: s, index: idx, length: s.length };
				start = idx + 1;
			}
		}
		return null;
	};

	// --- 3. 遍历并识别 ---
	uniqueNetList.forEach((net) => {
		if (!net || occupiedNets.has(net)) return;

		const netStr = String(net);
		const netU = netStr.toUpperCase();

		const posFound = findSuffixOccurrence(netU, posSuffixesUpper);
		const negFound = findSuffixOccurrence(netU, negSuffixesUpper);

		if (posFound) {
			const { index, length } = posFound;
			const base = netStr.slice(0, index) + netStr.slice(index + length);
			const key = (base || '').trim().toUpperCase();
			if (!potentialMap.has(key)) potentialMap.set(key, { origBase: base });
			const entry = potentialMap.get(key)!;
			if (!entry.p) entry.p = netStr;
		} else if (negFound) {
			const { index, length } = negFound;
			const base = netStr.slice(0, index) + netStr.slice(index + length);
			const key = (base || '').trim().toUpperCase();
			if (!potentialMap.has(key)) potentialMap.set(key, { origBase: base });
			const entry = potentialMap.get(key)!;
			if (!entry.n) entry.n = netStr;
		}
	});

	// --- 4. 冲突处理与组装 ---
	potentialMap.forEach((pair) => {
		if (pair.p && pair.n) {
			const displayBase = pair.origBase ?? '';
			let finalName = displayBase || pair.p.replace(/[^a-z0-9_\-]/gi, '_');
			let starCount = 0;
			let isDuplicated = false;

			if (existingPairNames.has(finalName)) {
				isDuplicated = true;
				while (existingPairNames.has(finalName)) {
					if (starCount < 5) {
						finalName += '*';
						starCount++;
					} else {
						finalName = (displayBase || finalName) + '*'.repeat(5);
						break;
					}
				}
			}

			const diffPair: IPCB_DifferentialPairItem = {
				name: finalName,
				positiveNet: pair.p,
				negativeNet: pair.n,
			};

			if (isDuplicated) duplicatedPairs.push(diffPair);
			else normalPairs.push(diffPair);

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
