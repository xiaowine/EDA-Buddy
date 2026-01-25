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
// 生成标准阻值序列（使用 IEC 60063 标准值）
export function generateStandardValues(series: ResistorSeries, minDecade: number, maxDecade: number): number[] {
	// IEC 60063 标准阻值系列（1-10 范围内的基础值）
	const standardBaseValues: Record<Exclude<ResistorSeries, 'ALL'>, number[]> = {
		E6: [1.0, 1.5, 2.2, 3.3, 4.7, 6.8],
		E12: [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2],
		E24: [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1],
		E48: [
			1.0, 1.05, 1.1, 1.15, 1.21, 1.27, 1.33, 1.4, 1.47, 1.54, 1.62, 1.69, 1.78, 1.87, 1.96, 2.05, 2.15, 2.26, 2.37, 2.49,
			2.61, 2.74, 2.87, 3.01, 3.16, 3.32, 3.48, 3.65, 3.83, 4.02, 4.22, 4.42, 4.64, 4.87, 5.11, 5.36, 5.62, 5.9, 6.19, 6.49,
			6.81, 7.15, 7.5, 7.87, 8.25, 8.66, 9.09, 9.53,
		],
		E96: [
			1.0, 1.02, 1.05, 1.07, 1.1, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.3, 1.33, 1.37, 1.4, 1.43, 1.47, 1.5, 1.54, 1.58,
			1.62, 1.65, 1.69, 1.74, 1.78, 1.82, 1.87, 1.91, 1.96, 2.0, 2.05, 2.1, 2.15, 2.21, 2.26, 2.32, 2.37, 2.43, 2.49, 2.55,
			2.61, 2.67, 2.74, 2.8, 2.87, 2.94, 3.01, 3.09, 3.16, 3.24, 3.32, 3.4, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
			4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49, 5.62, 5.76, 5.9, 6.04, 6.19, 6.34, 6.49, 6.65,
			6.81, 6.98, 7.15, 7.32, 7.5, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76,
		],
		E192: [
			1.0, 1.01, 1.02, 1.04, 1.05, 1.06, 1.07, 1.09, 1.1, 1.11, 1.13, 1.14, 1.15, 1.17, 1.18, 1.2, 1.21, 1.23, 1.24, 1.26,
			1.27, 1.29, 1.3, 1.32, 1.33, 1.35, 1.37, 1.38, 1.4, 1.42, 1.43, 1.45, 1.47, 1.49, 1.5, 1.52, 1.54, 1.56, 1.58, 1.6,
			1.62, 1.64, 1.65, 1.67, 1.69, 1.72, 1.74, 1.76, 1.78, 1.8, 1.82, 1.84, 1.87, 1.89, 1.91, 1.93, 1.96, 1.98, 2.0, 2.03,
			2.05, 2.08, 2.1, 2.13, 2.15, 2.18, 2.21, 2.23, 2.26, 2.29, 2.32, 2.34, 2.37, 2.4, 2.43, 2.46, 2.49, 2.52, 2.55, 2.58,
			2.61, 2.64, 2.67, 2.71, 2.74, 2.77, 2.8, 2.84, 2.87, 2.91, 2.94, 2.98, 3.01, 3.05, 3.09, 3.12, 3.16, 3.2, 3.24, 3.28,
			3.32, 3.36, 3.4, 3.44, 3.48, 3.52, 3.57, 3.61, 3.65, 3.7, 3.74, 3.79, 3.83, 3.88, 3.92, 3.97, 4.02, 4.07, 4.12, 4.17,
			4.22, 4.27, 4.32, 4.37, 4.42, 4.48, 4.53, 4.59, 4.64, 4.7, 4.75, 4.81, 4.87, 4.93, 4.99, 5.05, 5.11, 5.17, 5.23, 5.3,
			5.36, 5.42, 5.49, 5.56, 5.62, 5.69, 5.76, 5.83, 5.9, 5.97, 6.04, 6.12, 6.19, 6.26, 6.34, 6.42, 6.49, 6.57, 6.65, 6.73,
			6.81, 6.9, 6.98, 7.06, 7.15, 7.23, 7.32, 7.41, 7.5, 7.59, 7.68, 7.77, 7.87, 7.96, 8.06, 8.16, 8.25, 8.35, 8.45, 8.56,
			8.66, 8.76, 8.87, 8.98, 9.09, 9.2, 9.31, 9.42, 9.53, 9.65, 9.76, 9.88,
		],
	};

	let baseValues: number[] = [];

	if (series === 'ALL') {
		const set = new Set<number>();
		(Object.keys(standardBaseValues) as Array<Exclude<ResistorSeries, 'ALL'>>).forEach((k) => {
			standardBaseValues[k].forEach((v) => set.add(v));
		});
		baseValues = Array.from(set).sort((a, b) => a - b);
	} else {
		baseValues = [...standardBaseValues[series]];
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
