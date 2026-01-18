export type LedColor = 'red' | 'green' | 'blue' | 'white' | 'yellow';
export type LedFootprint = '0402' | '0603' | '0805';

export interface LedSpec {
	footprint: LedFootprint;
	color: LedColor;
	id: string;
	vendor?: string;
	note?: string;
}

// Core data: LED 列表（占位 id 使用 C12345）
export const LED_LIST: LedSpec[] = [
	// 0402
	{ footprint: '0402', color: 'red', id: 'C25503345' },
	{ footprint: '0402', color: 'green', id: 'C965793' },
	{ footprint: '0402', color: 'blue', id: 'C434447' },
	{ footprint: '0402', color: 'white', id: 'C20613596' },
	{ footprint: '0402', color: 'yellow', id: 'C25503856' },
	// 0603
	{ footprint: '0603', color: 'red', id: 'C965799' },
	{ footprint: '0603', color: 'green', id: 'C965804' },
	{ footprint: '0603', color: 'blue', id: 'C965807' },
	{ footprint: '0603', color: 'white', id: 'C965808' },
	{ footprint: '0603', color: 'yellow', id: 'C72038' },
	// 0805
	{ footprint: '0805', color: 'red', id: 'C965812' },
	{ footprint: '0805', color: 'green', id: 'C965815' },
	{ footprint: '0805', color: 'blue', id: 'C965817' },
	{ footprint: '0805', color: 'white', id: 'C34499' },
	{ footprint: '0805', color: 'yellow', id: 'C84261' },
];

const makeKey = (f: LedFootprint, c: LedColor) => `${f}|${c}`;
const LED_INDEX: Map<string, LedSpec> = new Map();
for (const l of LED_LIST) {
	LED_INDEX.set(makeKey(l.footprint, l.color), l);
}

export function getLedSpec(footprint: LedFootprint, color: LedColor): LedSpec | undefined {
	return LED_INDEX.get(makeKey(footprint, color));
}

export function getLedId(footprint: LedFootprint, color: LedColor): string | undefined {
	return LED_INDEX.get(makeKey(footprint, color))?.id;
}

export function listLedByFootprint(footprint: LedFootprint): LedSpec[] {
	return LED_LIST.filter((l) => l.footprint === footprint);
}

export function listLedByColor(color: LedColor): LedSpec[] {
	return LED_LIST.filter((l) => l.color === color);
}

export function ensureLedCoverage(): { missing: string[] } {
	const missing: string[] = [];
	const footprints: LedFootprint[] = ['0402', '0603', '0805'];
	const colors: LedColor[] = ['red', 'green', 'blue', 'white', 'yellow'];
	for (const f of footprints) {
		for (const c of colors) {
			if (!LED_INDEX.has(makeKey(f, c))) missing.push(makeKey(f, c));
		}
	}
	return { missing };
}
