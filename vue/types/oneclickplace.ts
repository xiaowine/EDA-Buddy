export enum NetPort {
	IN = 'IN',
	OUT = 'OUT',
	BI = 'BI',
}
export enum NetFLAG {
	POWER = 'Power',
	GROUND = 'Ground',
	ANALOG_GROUND = 'AnalogGround',
	PROTECT_GROUND = 'ProtectGround',
}

export interface NET {
	name: string;
	type: NetPort | NetFLAG;
}

export enum FOOTPRINT {
	RESISTOR_0402 = '0402',
	RESISTOR_0603 = '0603',
	RESISTOR_0805 = '0805',
}

export type ResistorValue = '4.7k' | '5.1k' | '10k' | '100k';
export type ResistorFootprint = '0402' | '0603' | '0805';
export type ResistorLcMap = Record<ResistorFootprint, Record<ResistorValue, string>>;

export const RESISTOR_LC_IDS: ResistorLcMap = {
	'0402': {
		'4.7k': 'C25900',
		'5.1k': 'C22356228',
		'10k': 'C2906861',
		'100k': 'C2906859',
	},
	'0603': {
		'4.7k': 'C2907034',
		'5.1k': 'C23186',
		'10k': 'C25804',
		'100k': 'C25803',
	},
	'0805': {
		'4.7k': 'C2907326',
		'5.1k': 'C2930296',
		'10k': 'C17414',
		'100k': 'C149504',
	},
};
