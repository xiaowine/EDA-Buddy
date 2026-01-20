import { MIL_TO_MM, MM_TO_MIL } from './utils';

/**
 * EDA Buddy Core Logic: Via Current Calculation
 * @param d_mm - 钻孔直径 (mm)
 * @param t_mm - 镀层厚度 (mm, 嘉立创为0.018mm)
 * @param deltaT - 允许温升 (°C)
 * @returns 最大电流 (Amps)
 */
export const calculateViaCurrent = (d_mm: number, t_mm: number, deltaT: number): number => {
	const k = 0.048; // 采用外层系数

	// 1. 转换单位并计算截面积 A (sq mil)
	const d = d_mm * MM_TO_MIL;
	const t = t_mm * MM_TO_MIL;
	const A = Math.PI * (d + t) * t;

	if (A <= 0) return 0;

	// 2. 执行 IPC-2221 公式
	const current = k * Math.pow(deltaT, 0.44) * Math.pow(A, 0.725);

	return current;
};

/**
 * 反向计算：根据目标电流计算过孔内径
 * @param current - 目标电流 (A)
 * @param t_mm - 镀层厚度 (mm)
 * @param deltaT - 允许温升 (°C)
 * @returns 过孔内径 (mm)
 */
export const calculateViaDiameterFromCurrent = (current: number, t_mm: number, deltaT: number): number => {
	if (current <= 0) return 0;

	const k = 0.048;

	// 把厚度换算为 mil 后计算截面积 A（sq mil）
	const t = t_mm * MM_TO_MIL;
	if (t <= 0) return 0;

	// 由 IPC-2221 公式反解 A
	const A = Math.pow(current / (k * Math.pow(deltaT, 0.44)), 1 / 0.725);
	if (A <= 0) return 0;

	// A = pi * (d + t) * t  => d = A / (pi * t) - t
	const d_mil = A / (Math.PI * t) - t;
	if (d_mil <= 0) return 0;

	// 转回 mm
	return d_mil * MIL_TO_MM;
};
