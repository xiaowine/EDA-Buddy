// Verify the math for 150k/100k combination
const vin = 1.5;
const r1 = 150000;  // 150kΩ
const r2 = 100000;  // 100kΩ

const vout = (vin * r2) / (r1 + r2);
console.log(`With R1=${r1}Ω (150kΩ) and R2=${r2}Ω (100kΩ):`);
console.log(`Vout = ${vout}V`);
console.log(`Target = 0.6V`);
console.log(`Error = ${Math.abs(vout - 0.6)}V = ${((Math.abs(vout - 0.6) / 0.6) * 100).toFixed(2)}%`);
console.log(`This is a PERFECT match (0% error)!\n`);

// Check if 150k and 100k are in E24 and E96 series
import { generateStandardValues } from './vue/utils/voltageDivider';

console.log('Checking if 150kΩ and 100kΩ are in E24 and E96 series...\n');

const e24Values = generateStandardValues('E24', -1, 6);
const e96Values = generateStandardValues('E96', -1, 6);

const has150kInE24 = e24Values.includes(150000);
const has100kInE24 = e24Values.includes(100000);
const has150kInE96 = e96Values.includes(150000);
const has100kInE96 = e96Values.includes(100000);

console.log(`E24 series:`);
console.log(`  150kΩ: ${has150kInE24 ? '✓ YES' : '✗ NO'}`);
console.log(`  100kΩ: ${has100kInE24 ? '✓ YES' : '✗ NO'}`);

console.log(`\nE96 series:`);
console.log(`  150kΩ: ${has150kInE96 ? '✓ YES' : '✗ NO'}`);
console.log(`  100kΩ: ${has100kInE96 ? '✓ YES' : '✗ NO'}`);

// Show some E24 values around 150k to debug
console.log('\nE24 values in 100k-200k range:');
e24Values.filter(v => v >= 100000 && v <= 200000).forEach(v => {
	console.log(`  ${v}Ω`);
});
