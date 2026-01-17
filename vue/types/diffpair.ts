// 差分对相关类型定义

/**
 * 差分对识别结果接口
 */
export interface DiffPairResult {
	duplicatedPairs: IPCB_DifferentialPairItem[]; // 重名差分对列表
	normalPairs: IPCB_DifferentialPairItem[]; // 正常差分对列表
	existingPairs: IPCB_DifferentialPairItem[]; // 已经存在的差分对
}
