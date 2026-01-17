// 电压分压器相关类型定义

// 标准阻值系列
export type ResistorSeries = 'E6' | 'E12' | 'E24' | 'E48' | 'E96' | 'E192' | 'ALL';

// 误差类型
export type ErrorMode = 'percent' | 'absolute';

// 枚举参数配置
export interface EnumerationConfig {
	series: ResistorSeries;
	minR: number; // 欧姆
	maxR: number; // 欧姆
	minRth: number; // 欧姆（戴维南等效阻抗最小值）
	maxRth: number; // 欧姆（戴维南等效阻抗最大值）
	errorMode: ErrorMode;
	errorValue: number; // 百分比（1-100）或绝对电压值（伏特）
}

// 阻值组合结果
export interface ResistorResult {
	r1: number; // 欧姆
	r2: number; // 欧姆
	vout: number; // 伏特（实际输出电压）
	error: number; // 误差（百分比或绝对值，根据 errorMode）
	current: number; // 安培（总电流）
	powerR1: number; // 瓦特（R1功耗）
	powerR2: number; // 瓦特（R2功耗）
	rth: number; // 欧姆（戴维南等效阻抗）
	powerTotal: number; // 瓦特（总功耗）
}
