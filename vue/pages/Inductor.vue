<template>
	<div class="inductor-calculator calculator-base">
		<header class="calc-header">
			<h3>电感参数计算</h3>
		</header>

		<form @submit.prevent class="calc-form">
			<div class="calc-field">
				<label>输入电压 (Vin)</label>
				<input class="calc-input" type="number" v-model.number="vin" step="0.01" min="0" />
				<div class="calc-field-suffix">V</div>
			</div>

			<div class="calc-field">
				<label>输出电压 (Vout)</label>
				<input class="calc-input" type="number" v-model.number="vout" step="0.01" min="0" />
				<div class="calc-field-suffix">V</div>
			</div>

			<div class="calc-field">
				<label>输出电流 (Iout)</label>
				<input class="calc-input" type="number" v-model.number="iout" step="0.01" min="0" />
				<div class="calc-field-suffix">A</div>
			</div>

			<div class="calc-field">
				<label>开关频率</label>
				<input class="calc-input" type="number" v-model.number="freq" step="0.1" min="0.001" />
				<div class="calc-field-suffix">kHz</div>
			</div>

			<div class="calc-field">
				<label>电流纹波系数</label>
				<input class="calc-input" type="number" v-model.number="ripplePctPercent" step="0.1" min="0" />
				<div class="calc-field-suffix">%</div>
			</div>
		</form>

		<div class="calc-result">
			<div class="calc-result-card">
				<div class="calc-result-inner">
					<div v-if="error" class="error">{{ error }}</div>
					<div v-else>
						<div class="calc-result-value">
							最小电感: <span class="calc-result-number">{{ minInductanceDisplay }}</span>
							<span class="calc-result-unit">uH</span>
						</div>
						<div class="calc-result-value">
							推荐电感: <span class="calc-result-number">{{ recommendedInductanceDisplay }}</span>
							<span class="calc-result-unit">uH</span>
						</div>
						<div class="calc-result-value">
							峰值电流: <span class="calc-result-number">{{ peakCurrentDisplay }}</span>
							<span class="calc-result-unit">A</span>
						</div>
						<div class="calc-result-note">基于经验公式计算<br />适用于非隔离开关电源拓扑</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { calcBuckInductor } from '../utils/inductor';

const vin = ref<number | null>(12);
const vout = ref<number | null>(5);
const iout = ref<number | null>(1);
// 频率以 kHz 输入，内部转换为 Hz（默认 300 kHz）
const freq = ref<number | null>(300);
// 用户以百分比输入纹波（例如 30 表示 30%）
const ripplePctPercent = ref<number | null>(30);

const error = computed(() => {
	if (vin.value === null || vout.value === null || iout.value === null || freq.value === null || ripplePctPercent.value === null)
		return '请填写所有字段';
	if (isNaN(vin.value) || isNaN(vout.value) || isNaN(iout.value) || isNaN(freq.value) || isNaN(ripplePctPercent.value)) return '输入必须为数字';
	if (vin.value <= 0) return '输入电压必须大于 0';
	if (vout.value <= 0) return '输出电压必须大于 0';
	if (iout.value <= 0) return '输出电流必须大于 0';
	if (freq.value <= 0) return '频率必须大于 0 (kHz)';
	if (ripplePctPercent.value <= 0 || ripplePctPercent.value >= 100) return '电流纹波系数必须在 0~100 之间（百分比）';
	return '';
});

const result = computed(() => {
	if (error.value) return null;
	const rippleDecimal = (ripplePctPercent.value as number) / 100;
	// 将 kHz 转为 Hz 传入计算函数
	const freqHz = (freq.value as number) * 1000;
	const res = calcBuckInductor(vin.value as number, vout.value as number, iout.value as number, freqHz, rippleDecimal);
	return res;
});

const minInductanceDisplay = computed(() => {
	if (!result.value) return '--';
	return result.value.inductance_uH.toFixed(2);
});

const peakCurrentDisplay = computed(() => {
	if (!result.value) return '--';
	return result.value.peakCurrent_A.toFixed(2);
});

// 常见电感标称值 (uH)，按升序排列
const STANDARD_INDUCTANCES_UH = [0.01, 0.022, 0.033, 0.047, 0.068, 0.1, 0.15, 0.22, 0.33, 0.47, 1, 2.2, 3.3, 4.7, 6.8, 10, 22, 33, 47, 68, 100];

const recommendedInductanceDisplay = computed(() => {
	if (!result.value) return '--';
	const L = result.value.inductance_uH;
	// 找到第一个不小于 L 的常见值
	const found = STANDARD_INDUCTANCES_UH.find((v) => v >= L);
	const pick = found ?? Number(L.toFixed(2));
	return pick.toFixed(2);
});
</script>

<style scoped lang="scss">
@use '../styles/calculator-mixins.scss' as *;

.inductor-calculator {
	@include calculator-base;
	padding: 16px;
	box-shadow: var(--calc-shadow);

	.calc-header {
		@include calc-header;
	}

	.calc-form {
		@include calc-form;
		gap: 10px;
	}

	.calc-field {
		@include calc-field;
	}

	.calc-field > label {
		width: 160px;
		display: inline-block;
	}

	.calc-input {
		@include calc-input;
		width: 110px;
		min-width: 80px;
		padding: 8px;
		border-radius: 8px;
		outline: none;

		&:focus {
			box-shadow: var(--calc-focus-ring);
			border-color: var(--calc-primary);
		}
	}

	.calc-field-suffix {
		@include calc-field-suffix;
		width: 48px;
	}

	.calc-result {
		@include calc-result;
	}

	.calc-result-card {
		@include calc-result-card;
		padding: 10px 12px;
		gap: 12px;
		display: flex;
		flex-direction: column;
	}

	.calc-result-inner {
		min-height: 120px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 8px;
	}

	.calc-result-value {
		@include calc-result-value;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		border-radius: 6px;
	}

	/* use shared .calc-result-number from calculator-common.scss */

	.calc-result-unit {
		@include calc-result-unit;
	}

	.calc-result-note {
		@include calc-result-note;
		padding-top: 5px;
	}

	@include hide-number-input-controls;
	@include reduced-motion;
}
</style>
