import { MM_TO_MIL } from './utils';

// 默认常量
export const DEFAULT_1OZ_MM = 0.035;
export const DEFAULT_0_5OZ_MM = 0.0175;
export const DEFAULT_MANUFACTURABLE_MIN_MM = 0.1;

/**
 * EDA Buddy 基础线宽载流计算
 * @param width_mm - 线宽 (mm)
 * @param thick_mm - 铜厚 (mm, 1oz通常取0.035)
 * @param deltaT - 允许温升 (°C)
 * @param isExternal - 是否为外层走线 (true为外层, false为内层)
 */
export const calcTraceCurrent = (width_mm: number, thick_mm: number, deltaT: number, isExternal = true): number => {
	// 1. 单位统一转为 mil
	const width_mil = width_mm * MM_TO_MIL;
	const thick_mil = thick_mm * MM_TO_MIL;

	// 2. 计算参数
	const k = isExternal ? 0.048 : 0.024;
	const A = width_mil * thick_mil; // 截面积

	// 3. IPC-2221 公式: I = k * ΔT^0.44 * A^0.725
	return k * Math.pow(deltaT, 0.44) * Math.pow(A, 0.725);
};

/**
 * 反向求解：给定目标电流，求最小满足的线宽（mm）
 * 使用稳健的二分法在宽度区间内求解（单位为 mm）
 * @returns { width_mm|null, converged, iterations }
 */
export function solveWidthFromCurrent(
	I_A: number,
	thick_mm: number,
	deltaT: number,
	isExternal = true,
	opts?: { minWidthMm?: number; maxWidthMm?: number; tol?: number; maxIter?: number },
) {
	const minW = opts?.minWidthMm ?? 1e-4;
	const maxW = opts?.maxWidthMm ?? 100;
	const tol = opts?.tol ?? 1e-6;
	const maxIter = opts?.maxIter ?? 80;

	// check monotonicity: calcTraceCurrent 随宽度增大单调递增
	let lo = minW;
	let hi = maxW;
	let fLo = calcTraceCurrent(lo, thick_mm, deltaT, isExternal) - I_A;
	let fHi = calcTraceCurrent(hi, thick_mm, deltaT, isExternal) - I_A;

	if (fLo >= 0) {
		// even the smallest width gives >= I_A
		return { width_mm: lo, converged: true, iterations: 0 };
	}

	if (fHi < 0) {
		// cannot reach target even at very large width
		return { width_mm: null, converged: false, iterations: 0 };
	}

	let mid = lo;
	let iter = 0;
	while (iter < maxIter) {
		mid = (lo + hi) / 2;
		const fMid = calcTraceCurrent(mid, thick_mm, deltaT, isExternal) - I_A;
		if (Math.abs(fMid) <= tol) {
			return { width_mm: mid, converged: true, iterations: iter + 1 };
		}
		if (fMid < 0) {
			lo = mid;
		} else {
			hi = mid;
		}
		if (hi - lo <= tol) {
			return { width_mm: (lo + hi) / 2, converged: true, iterations: iter + 1 };
		}
		iter++;
	}

	return { width_mm: (lo + hi) / 2, converged: false, iterations: iter };
}
