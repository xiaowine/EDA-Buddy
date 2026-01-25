// Check the E series generation algorithm
import { generateStandardValues } from './vue/utils/voltageDivider';

console.log('E24 series base values (1-10 range):');
const e24Count = 24;
for (let i = 0; i < e24Count; i++) {
	const v = Math.pow(10, i / e24Count);
	console.log(`i=${i}: ${v.toFixed(5)} -> ${(v * 100000).toFixed(0)}Ω at 100k decade`);
}

console.log('\n\nE96 series base values (1-10 range), looking for 1.5:');
const e96Count = 96;
for (let i = 0; i < e96Count; i++) {
	const v = Math.pow(10, i / e96Count);
	if (v >= 1.45 && v <= 1.55) {
		console.log(`i=${i}: ${v.toFixed(5)} -> ${(v * 100000).toFixed(0)}Ω at 100k decade`);
	}
}

// Let me check what value would give us 1.5
// We want: 10^(i/24) = 1.5
// i/24 = log10(1.5)
// i = 24 * log10(1.5)
const targetForE24 = 24 * Math.log10(1.5);
console.log(`\nFor 1.5 in E24: i = ${targetForE24}`);
console.log(`Rounded: ${Math.round(targetForE24)}`);
console.log(`Actual value at i=${Math.round(targetForE24)}: ${Math.pow(10, Math.round(targetForE24) / 24)}`);

const targetForE96 = 96 * Math.log10(1.5);
console.log(`\nFor 1.5 in E96: i = ${targetForE96}`);
console.log(`Rounded: ${Math.round(targetForE96)}`);
console.log(`Actual value at i=${Math.round(targetForE96)}: ${Math.pow(10, Math.round(targetForE96) / 96)}`);

// Check standard E24 values according to IEC 60063
console.log('\n\nStandard E24 values (1-10 range):');
const standardE24 = [
	1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
	3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];
console.log(standardE24.join(', '));
console.log(`Count: ${standardE24.length}`);

console.log('\nChecking if 1.5 is in standard E24: ', standardE24.includes(1.5) ? 'YES' : 'NO');
