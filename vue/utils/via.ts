import { MM_TO_MIL } from './utils';

/**
 * EDA Buddy Core Logic: Via Current Calculation
 * @param d_mm - 钻孔直径 (mm)
 * @param t_mm - 镀层厚度 (mm, 嘉立创为0.018mm)
 * @param deltaT - 允许温升 (°C)
 * @returns 最大电流 (Amps)
 */
export const calculateViaCurrent = (d_mm: number, t_mm: number, deltaT: number): number => {
	const k = 0.024; // 采用保守的内层系数

	// 1. 转换单位并计算截面积 A (sq mil)
	const d = d_mm * MM_TO_MIL;
	const t = t_mm * MM_TO_MIL;
	const A = Math.PI * (d + t) * t;

	if (A <= 0) return 0;

	// 2. 执行 IPC-2221 公式
	const current = k * Math.pow(deltaT, 0.44) * Math.pow(A, 0.725);

	return current;
};
