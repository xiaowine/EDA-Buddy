export type ResistorValue = '4.7k' | '5.1k' | '10k' | '100k';
export type ResistorFootprint = '0402' | '0603' | '0805';

export interface ResistorSpec {
	footprint: ResistorFootprint;
	value: ResistorValue;
	id: string;
	vendor?: string;
	note?: string;
}

// Core data: a human-friendly list of resistor specs. 可扩展的主数据源。
export const RESISTOR_LIST: ResistorSpec[] = [
	{ footprint: '0402', value: '4.7k', id: 'C25900' },
	{ footprint: '0402', value: '5.1k', id: 'C22356228' },
	{ footprint: '0402', value: '10k', id: 'C2906861' },
	{ footprint: '0402', value: '100k', id: 'C2906859' },

	{ footprint: '0603', value: '4.7k', id: 'C2907034' },
	{ footprint: '0603', value: '5.1k', id: 'C23186' },
	{ footprint: '0603', value: '10k', id: 'C25804' },
	{ footprint: '0603', value: '100k', id: 'C25803' },

	{ footprint: '0805', value: '4.7k', id: 'C2907326' },
	{ footprint: '0805', value: '5.1k', id: 'C2930296' },
	{ footprint: '0805', value: '10k', id: 'C17414' },
	{ footprint: '0805', value: '100k', id: 'C149504' },
];

// 派生索引：用于高效查找
const makeKey = (f: ResistorFootprint, v: ResistorValue) => `${f}|${v}`;
const RESISTOR_INDEX: Map<string, ResistorSpec> = new Map();
for (const r of RESISTOR_LIST) {
	RESISTOR_INDEX.set(makeKey(r.footprint, r.value), r);
}

export function getResistorSpec(footprint: ResistorFootprint, value: ResistorValue): ResistorSpec | undefined {
	return RESISTOR_INDEX.get(makeKey(footprint, value));
}

export function getLcId(footprint: ResistorFootprint, value: ResistorValue): string | undefined {
	return RESISTOR_INDEX.get(makeKey(footprint, value))?.id;
}

export function listByFootprint(footprint: ResistorFootprint): ResistorSpec[] {
	return RESISTOR_LIST.filter((r) => r.footprint === footprint);
}

export function ensureCoverage(): { missing: string[] } {
	const missing: string[] = [];
	const footprints: ResistorFootprint[] = ['0402', '0603', '0805'];
	const values: ResistorValue[] = ['4.7k', '5.1k', '10k', '100k'];
	for (const f of footprints) {
		for (const v of values) {
			if (!RESISTOR_INDEX.has(makeKey(f, v))) missing.push(makeKey(f, v));
		}
	}
	return { missing };
}
