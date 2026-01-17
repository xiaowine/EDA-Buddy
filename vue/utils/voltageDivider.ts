// 电压分压器计算与反向阻值枚举工具
// 支持正向计算（Vout/I/Power）和反向枚举（给定 Vin/Vout 反推阻值组合）
import type { EnumerationConfig, ResistorResult, ResistorSeries } from '../types/voltageDivider';

// 正向计算：给定 Vin, R1, R2 计算输出
export function calcVout(vin: number, r1: number, r2: number): number {
	if (!r1 || !r2 || r1 <= 0 || r2 <= 0) return 0;
	return (vin * r2) / (r1 + r2);
}

export function calcCurrent(vin: number, r1: number, r2: number): number {
	if (!r1 || !r2 || r1 <= 0 || r2 <= 0) return 0;
	return vin / (r1 + r2);
}

export function calcPowerR1(vin: number, r1: number, r2: number): number {
	if (!r1 || !r2 || r1 <= 0 || r2 <= 0) return 0;
	const current = calcCurrent(vin, r1, r2);
	return current * current * r1;
}

export function calcPowerR2(vin: number, r1: number, r2: number): number {
	if (!r1 || !r2 || r1 <= 0 || r2 <= 0) return 0;
	const current = calcCurrent(vin, r1, r2);
	return current * current * r2;
}

export function calcTheveninResistance(r1: number, r2: number): number {
	if (!r1 || !r2 || r1 <= 0 || r2 <= 0) return 0;
	return (r1 * r2) / (r1 + r2);
}
// 解析带单位的电阻值
export function parseResistance(input: string | number): number {
	if (typeof input === 'number') return input;

	const str = input.toString().trim();
	if (!str) return 0;

	// 提取数字部分和单位 - 保持原始大小写以区分M和m
	const match = str.match(/^([0-9]*\.?[0-9]+)\s*([kmMgGμu]?)ω?$/i);
	if (!match) {
		// 如果没有匹配到单位，尝试纯数字
		const num = parseFloat(str);
		return isNaN(num) ? 0 : num;
	}

	const value = parseFloat(match[1]);
	const unit = match[2];

	if (isNaN(value)) return 0;

	switch (unit.toLowerCase()) {
		case 'μ':
		case 'u':
			return value * 1e-6;
		case 'm':
			// 检查原始输入中是否为大写M（兆欧）
			if (str.includes('M')) {
				return value * 1e6;
			} else {
				return value * 1e-3; // 小写m为毫欧
			}
		case 'k':
			return value * 1e3;
		case 'g':
			return value * 1e9;
		default:
			return value;
	}
}
// 生成标准阻值序列（改为基于公式生成 E 系列基础值）
export function generateStandardValues(series: ResistorSeries, minDecade: number, maxDecade: number): number[] {
	const seriesCounts: Record<Exclude<ResistorSeries, 'ALL'>, number> = {
		E6: 6,
		E12: 12,
		E24: 24,
		E48: 48,
		E96: 96,
		E192: 192,
	};

	// 生成单个 E 系列在一个数量级内的基础值，范围 [1, 10)
	function genBase(n: number): number[] {
		const arr: number[] = [];
		for (let i = 0; i < n; i++) {
			const v = Math.pow(10, i / n);
			arr.push(Number(v.toFixed(5)));
		}
		return arr;
	}

	let baseValues: number[] = [];

	if (series === 'ALL') {
		const set = new Set<number>();
		(Object.keys(seriesCounts) as Array<Exclude<ResistorSeries, 'ALL'>>).forEach((k) => {
			genBase(seriesCounts[k]).forEach((v) => set.add(v));
		});
		baseValues = Array.from(set).sort((a, b) => a - b);
	} else {
		baseValues = genBase(seriesCounts[series]);
	}

	const result: number[] = [];

	for (let decade = minDecade; decade <= maxDecade; decade++) {
		const multiplier = Math.pow(10, decade);
		baseValues.forEach((value) => result.push(value * multiplier));
	}

	return result.sort((a, b) => a - b);
}

// 查找最接近的标准阻值
export function findClosestStandardValue(target: number, standardValues: number[]): number {
	if (standardValues.length === 0) return target;

	let closest = standardValues[0];
	let minDiff = Math.abs(target - closest);

	for (const value of standardValues) {
		const diff = Math.abs(target - value);
		if (diff < minDiff) {
			minDiff = diff;
			closest = value;
		}
	}

	return closest;
}

// 反向枚举：解析式方法
export function enumerateResistorsCombinations(vin: number, vtarget: number, config: EnumerationConfig): ResistorResult[] {
	if (!vin || vin <= 0 || !vtarget || vtarget <= 0 || vtarget >= vin) {
		return [];
	}

	const targetRatio = vtarget / vin;
	const standardValues = generateStandardValues(config.series, -1, 6).filter((val) => val >= config.minR && val <= config.maxR);

	const results: ResistorResult[] = [];

	// 解析式枚举：对每个 R1 计算理想 R2 并查找最近标准值
	for (const r1 of standardValues) {
		const r2Ideal = (targetRatio * r1) / (1 - targetRatio);

		if (r2Ideal <= 0 || r2Ideal < config.minR || r2Ideal > config.maxR) continue;

		// 查找最接近的标准 R2 值（考虑上下邻值）
		const r2Candidates = [findClosestStandardValue(r2Ideal, standardValues)];

		// 添加相邻值以提高覆盖率
		const idealIndex = standardValues.findIndex(
			(val) => Math.abs(val - r2Ideal) === Math.abs(findClosestStandardValue(r2Ideal, standardValues) - r2Ideal),
		);
		if (idealIndex > 0) r2Candidates.push(standardValues[idealIndex - 1]);
		if (idealIndex < standardValues.length - 1) r2Candidates.push(standardValues[idealIndex + 1]);

		for (const r2 of [...new Set(r2Candidates)]) {
			if (r2 < config.minR || r2 > config.maxR) continue;

			// 计算实际结果
			const vout = calcVout(vin, r1, r2);
			const current = calcCurrent(vin, r1, r2);
			const powerR1 = calcPowerR1(vin, r1, r2);
			const powerR2 = calcPowerR2(vin, r1, r2);
			const rth = calcTheveninResistance(r1, r2);

			// 检查戴维南阻抗限制
			if (rth < config.minRth || rth > config.maxRth) continue;

			// 计算误差
			let error: number;
			if (config.errorMode === 'percent') {
				error = (Math.abs(vout - vtarget) / vtarget) * 100;
			} else {
				error = Math.abs(vout - vtarget);
			}

			// 检查误差限制
			if (error > config.errorValue) continue;

			results.push({
				r1,
				r2,
				vout,
				error,
				current,
				powerR1,
				powerR2,
				rth,
				powerTotal: powerR1 + powerR2,
			});
		}
	}

	// 去重（基于 r1、r2 值的相似性）
	const uniqueResults = results.filter((result, index, arr) => {
		return !arr
			.slice(0, index)
			.some(
				(prev) =>
					Math.abs(prev.r1 - result.r1) / Math.max(prev.r1, result.r1) < 0.001 &&
					Math.abs(prev.r2 - result.r2) / Math.max(prev.r2, result.r2) < 0.001,
			);
	});

	// 按误差排序并返回所有结果
	return uniqueResults.sort((a, b) => a.error - b.error);
}

// 格式化阻值显示（带单位）
export function formatResistance(value: number): string {
	if (value >= 1e6) return `${(value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 2)}MΩ`;
	if (value >= 1e3) return `${(value / 1e3).toFixed(value % 1e3 === 0 ? 0 : 2)}kΩ`;
	return `${value.toFixed(0)}Ω`;
}

// 格式化功率显示（带单位）
export function formatPower(value: number): string {
	if (value >= 1) return `${value.toFixed(2)}W`;
	if (value >= 1e-3) return `${(value * 1e3).toFixed(1)}mW`;
	if (value >= 1e-6) return `${(value * 1e6).toFixed(1)}μW`;
	return `${(value * 1e9).toFixed(1)}nW`;
}
