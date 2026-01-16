// solveWidthFromCurrent 函数的选项参数类型
export interface SolveWidthOptions {
	minWidthMm?: number;
	maxWidthMm?: number;
	tol?: number;
	maxIter?: number;
}

// solveWidthFromCurrent 函数的返回值类型
export interface SolveWidthResult {
	width_mm: number | null;
	converged: boolean;
	iterations: number;
}
