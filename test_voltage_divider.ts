// Test for voltage divider reverse calculation issue
import { enumerateResistorsCombinations } from './vue/utils/voltageDivider';
import type { EnumerationConfig } from './vue/types/voltageDivider';

// Test case from the issue:
// Input: 1.5V, Output: 0.6V
// Expected: 150k/100k resistor combination
// 150k is in E24 and E96 series

const config: EnumerationConfig = {
	series: 'E96',
	minR: 10000,      // 10kΩ
	maxR: 1000000,    // 1MΩ
	minRth: 0,
	maxRth: 10000000,
	errorMode: 'percent',
	errorValue: 1,    // 1% error tolerance
};

console.log('Testing voltage divider reverse calculation...\n');
console.log('Input voltage: 1.5V');
console.log('Target output voltage: 0.6V');
console.log('Expected combination: 150kΩ / 100kΩ\n');

const results = enumerateResistorsCombinations(1.5, 0.6, config);

console.log(`Found ${results.length} combinations\n`);

// Check if 150k/100k combination exists
const expectedCombination = results.find(r => 
	Math.abs(r.r1 - 150000) < 1 && 
	Math.abs(r.r2 - 100000) < 1
);

if (expectedCombination) {
	console.log('✓ Found expected 150kΩ / 100kΩ combination:');
	console.log(`  R1: ${expectedCombination.r1}Ω`);
	console.log(`  R2: ${expectedCombination.r2}Ω`);
	console.log(`  Vout: ${expectedCombination.vout}V`);
	console.log(`  Error: ${expectedCombination.error}%`);
} else {
	console.log('✗ Expected 150kΩ / 100kΩ combination NOT found!');
}

// Show first 10 results
console.log('\nFirst 10 results:');
results.slice(0, 10).forEach((r, i) => {
	console.log(`${i + 1}. R1: ${r.r1}Ω, R2: ${r.r2}Ω, Vout: ${r.vout.toFixed(3)}V, Error: ${r.error.toFixed(3)}%`);
});

// Test with E24 series as well
console.log('\n\nTesting with E24 series (150k should also be in E24)...\n');
const configE24: EnumerationConfig = {
	series: 'E24',
	minR: 10000,
	maxR: 1000000,
	minRth: 0,
	maxRth: 10000000,
	errorMode: 'percent',
	errorValue: 1,
};

const resultsE24 = enumerateResistorsCombinations(1.5, 0.6, configE24);
console.log(`Found ${resultsE24.length} combinations with E24\n`);

const expectedE24 = resultsE24.find(r => 
	Math.abs(r.r1 - 150000) < 1 && 
	Math.abs(r.r2 - 100000) < 1
);

if (expectedE24) {
	console.log('✓ Found expected 150kΩ / 100kΩ combination in E24');
} else {
	console.log('✗ Expected 150kΩ / 100kΩ combination NOT found in E24!');
}
