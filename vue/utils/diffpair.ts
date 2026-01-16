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
 * 差分对识别结果接口
 */
export interface DiffPairResult {
	duplicatedPairs: IPCB_DifferentialPairItem[]; // 重名差分对列表
	normalPairs: IPCB_DifferentialPairItem[]; // 正常差分对列表
	existingPairs: IPCB_DifferentialPairItem[]; // 已经存在的差分对
}
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
