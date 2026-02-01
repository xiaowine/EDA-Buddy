/**
 * 过滤字符串数组：必须匹配 include（正则或子串），且不匹配 exclude（正则或子串）
 *
 * - `include` 可以是单个 `RegExp`、单个字符串（作为子串匹配），或数组
 * - `exclude` 同上，可选，不提供则仅按 include 过滤
 *
 * 返回符合条件的字符串数组
 */
export function filterStringsByRegex(
	items: string[],
	include: RegExp | string | Array<RegExp | string>,
	exclude?: RegExp | string | Array<RegExp | string>,
): string[] {
	const includes = Array.isArray(include) ? include : [include];
	const excludes = exclude ? (Array.isArray(exclude) ? exclude : [exclude]) : [];

	const test = (pattern: RegExp | string, s: string) => {
		if (pattern instanceof RegExp) return pattern.test(s);
		return s.indexOf(pattern) !== -1;
	};

	return items.filter((item) => {
		const incOk = includes.length === 0 ? true : includes.some((p) => test(p, item));
		const excOk = excludes.some((p) => test(p, item));
		return incOk && !excOk;
	});
}

/**
 * 电源名称匹配正则（包含）
 *
 * 精确匹配（作为子串，允许前后任意字符）：
 * - "*.*v": 数字.数字v，例如 1.2v  -> \d+\.\d+v
 * - "*v*": 数字v数字或数字v，例如 1v2 或 5v -> \d+v\d*
 * - "vdd*"/"vcc*": vdd/vcc 后可跟字母或数字 -> vdd[a-z0-9]* / vcc[a-z0-9]*
 * - "vbus*": vbus 后可跟数字 -> vbus\d*
 */
export const POWER_INCLUDE_REGEX = /(?:(?:\d+\.\d+v)|(?:\d+v\d*)|vdd[a-z0-9]*|vcc[a-z0-9]*|vbus\d*)/i;

/**
 * 电源名称排除正则（任意位置匹配）
 * 包含 `en`、`fb`、`ctrl` 的字符串将被排除
 */
export const POWER_EXCLUDE_REGEX = /(en|fb|ctrl)/i;

/**
 * 专用：过滤电源网络名
 * - 保留匹配 `POWER_INCLUDE_REGEX` 的项
 * - 且排除包含 `en|fb|ctrl` 的项
 */
export function filterPowerNets(items: string[]): string[] {
	return filterStringsByRegex(items, POWER_INCLUDE_REGEX, POWER_EXCLUDE_REGEX);
}

/**
 * 简化的差分对识别函数。
 *
 * 功能：从给定的网络名数组中识别配对的正/负差分网络，并返回建议的差分对名称及对应的正负网络。
 *
 * 匹配规则（简要）：
 * - 通过传入的正/负后缀列表识别正/负极（大小写不敏感），后缀可以出现在网络名的任意位置；
 * - 为避免误匹配（如在单词中间匹配到 P/N），要求后缀之后必须是字符串结尾或非字母数字字符；
 * - 识别时会将后缀移除以得到基名，并以基名（大写规范）分组以配对正/负网络；
 * - 当同一基名存在多组正或负网络时，仅保留首次出现的正/负网络；
 * - 返回数组元素类型为 `IPCB_DifferentialPairItem`，包含 `name`, `positiveNet`, `negativeNet`。
 *
 * 注意：该函数为简化版，不会检查已存在的差分对或与器件的连接，仅用于快速识别可能的差分对。
 *
 * @param netList - 网络名字符串数组
 * @param positiveSuffixes - 正极后缀数组（默认常见后缀），匹配时不区分大小写
 * @param negativeSuffixes - 负极后缀数组（默认常见后缀），匹配时不区分大小写
 * @returns 识别出的差分对数组，每项含 `name`, `positiveNet`, `negativeNet`
 */
export function identifyDiffPairsSimple(
	netList: string[],
	positiveSuffixes: string[] = ['P', '+', 'DP', 'H', 'DP'],
	negativeSuffixes: string[] = ['N', '-', 'DN', 'L', 'DM'],
): IPCB_DifferentialPairItem[] {
	if (!netList || netList.length === 0) return [];

	const normalizeAndSort = (arr: string[]) =>
		Array.from(new Set(arr.map((s) => (s || '').toUpperCase().trim()))).sort((a, b) => b.length - a.length);

	const posSuffixes = normalizeAndSort(positiveSuffixes);
	const negSuffixes = normalizeAndSort(negativeSuffixes);
	const allSuffixes = [...posSuffixes, ...negSuffixes];

	if (allSuffixes.length === 0) return [];

	// 支持后缀在任意位置出现，但要求后缀之后为字符串结尾或非字母数字
	const uniqueNets = Array.from(new Set(netList)).filter(Boolean);
	const groups = new Map<string, { origBase?: string; p?: string; n?: string }>();

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

	uniqueNets.forEach((net) => {
		const netStr = String(net);
		const netU = netStr.toUpperCase();

		const posFound = findSuffixOccurrence(netU, posSuffixes);
		const negFound = findSuffixOccurrence(netU, negSuffixes);

		if (posFound) {
			const { index, length } = posFound;
			const base = netStr.slice(0, index) + netStr.slice(index + length);
			const key = (base || '').trim().toUpperCase();
			if (!groups.has(key)) groups.set(key, { origBase: base });
			const entry = groups.get(key)!;
			if (!entry.p) entry.p = netStr;
		} else if (negFound) {
			const { index, length } = negFound;
			const base = netStr.slice(0, index) + netStr.slice(index + length);
			const key = (base || '').trim().toUpperCase();
			if (!groups.has(key)) groups.set(key, { origBase: base });
			const entry = groups.get(key)!;
			if (!entry.n) entry.n = netStr;
		}
	});

	const result: IPCB_DifferentialPairItem[] = [];
	const nameSet = new Set<string>();

	groups.forEach((v) => {
		if (v.p && v.n) {
			const display = v.origBase ?? '';
			let finalName = display || (v.p || '').replace(/[^a-z0-9_\-]/gi, '_');
			let tries = 0;
			while (nameSet.has(finalName)) {
				if (tries < 5) {
					finalName = finalName + '*';
				} else {
					finalName = `${display || finalName}-${tries - 4}`;
				}
				tries++;
			}
			nameSet.add(finalName);
			result.push({ name: finalName, positiveNet: v.p, negativeNet: v.n });
		}
	});

	return result;
}
