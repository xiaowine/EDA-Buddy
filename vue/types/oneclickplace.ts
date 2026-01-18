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
