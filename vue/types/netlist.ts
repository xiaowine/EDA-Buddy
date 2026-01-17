/**
 * 嘉立创EDA (EasyEDA) 网表文件格式 (.enet)
 */
export interface EasyEDANetlist {
	version: string; // 例如 "2.0.0"
	components: Record<string, Component>;
	// 复杂的网表还可能包含以下可选字段
	netClass?: Record<string, any>;
	differentialPair?: Record<string, any>;
	equalLengthNetGroup?: Record<string, any>;
}

/**
 * 元器件对象定义
 */
export interface Component {
	props: ComponentProps;
	pinInfoMap: Record<string, PinInfo>;
}

/**
 * 元器件属性
 * 注意：根据元器件类型不同（电阻、USB接口、IC），字段会有所增减
 */
export interface ComponentProps {
	// 核心标识
	Designator: string; // 位号，如 "C3", "U1"
	'Unique ID': string; // 唯一标识符
	Name: string; // 元件名称
	Device: string; // 设备代码

	// 封装与物理信息
	Footprint: string; // 封装ID
	FootprintName: string; // 封装名称，如 "R0603"
	'PCB Layer': string; // 所在层，如 "TopLayer"
	'3D Model'?: string; // 3D模型资源ID
	'3D Model Title'?: string; // 3D模型名称
	'3D Model Transform'?: string; // 3D模型变换参数（坐标/缩放）

	// 物料与供应链信息
	'LCSC Part Name'?: string; // 立创商城零件名称
	'Supplier Part'?: string; // 供应商编号（C号）
	Manufacturer?: string; // 制造商
	'Manufacturer Part'?: string; // 制造商型号
	Datasheet?: string; // 数据手册链接
	Supplier?: string; // 供应商（如 "LCSC"）
	'JLCPCB Part Class'?: string; // 嘉立创零件类别

	// 电气参数 (随组件动态变化)
	Value?: string; // 数值，如 "100uF", "10k"
	Tolerance?: string; // 精度
	'Voltage Rating'?: string; // 额定电压
	Description?: string; // 详细描述

	// 流程控制
	'Add into BOM': 'yes' | 'no';
	'Convert to PCB': 'yes' | 'no';

	// 其他
	'Group ID'?: string;
	'Channel ID'?: string;
	'Reuse Block'?: string;
}

/**
 * 引脚连接信息
 */
export interface PinInfo {
	name: string; // 引脚逻辑名称（有些元件为空串）
	number: string; // 引脚编号，如 "1", "2", "A1"
	net: string; // 连接的网络名称，如 "GND", "+5V", "$1N80"
}

/**
 * 被动器件信息及其连接的引脚 - 从 Component 与 pins 数组组合而成
 */
export interface PassiveComponentWithPins {
	component: Component;
	pins: string[];
	otherNet?: string; // 另一端连接的网络（用于未配对器件）
}

/**
 * 连接到差分对网络的被动器件
 */
export interface PassiveComponentConnected {
	designator: string;
	footprint: string;
	pinInfoMap: Record<string, PinInfo>;
	connectedPins: string[];
	connectedNets: string[];
}

/**
 * 未配对器件信息（差分对识别用）
 * 表示在已存在的差分对网络上发现的未配对器件
 */
export interface PassiveComponentPair {
	differentialPairName: string; // 现有差分对名称
	existingPositiveNet: string; // 现有差分对的正网络
	existingNegativeNet: string; // 现有差分对的负网络
	unpairedPositiveNet?: string; // 包含未配对器件的正网络
	unpairedNegativeNet?: string; // 包含未配对器件的负网络
	unpairedPositiveDesignators?: string[]; // 正网络上的未配对器件位号
	unpairedNegativeDesignators?: string[]; // 负网络上的未配对器件位号
	matchReason: 'unpaired';
}
