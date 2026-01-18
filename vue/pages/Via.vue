<template>
	<div class="via-calculator calculator-base">
		<header class="calc-header">
			<h3>过孔参数计算</h3>
		</header>

		<form @submit.prevent class="calc-form">
			<div class="calc-field">
				<label style="width: 120px">单位</label>
				<div class="calc-segmented">
					<button type="button" :class="{ active: unit === 'mm' }" @click="changeUnit('mm')">mm</button>
					<button type="button" :class="{ active: unit === 'mil' }" @click="changeUnit('mil')">mil</button>
				</div>
			</div>

			<div class="calc-field">
				<label style="width: 120px">过孔内径</label>
				<input
					class="calc-input"
					style="width: 140px; min-width: 100px; padding: 8px"
					type="number"
					v-model.number="d"
					step="0.001"
					min="0"
				/>
				<div class="calc-field-suffix" style="width: 48px">{{ unit }}</div>
			</div>

			<div class="calc-field">
				<label style="width: 120px">镀层厚度</label>
				<input
					class="calc-input"
					style="width: 140px; min-width: 100px; padding: 8px"
					type="number"
					v-model.number="t"
					step="0.001"
					min="0"
				/>
				<div class="calc-field-suffix" style="width: 48px">{{ unit }}</div>
			</div>

			<div class="calc-field">
				<label style="width: 120px">允许温升</label>
				<input
					class="calc-input"
					style="width: 140px; min-width: 100px; padding: 8px"
					type="number"
					v-model.number="deltaT"
					step="0.1"
					min="0"
				/>
				<div class="calc-field-suffix" style="width: 48px">°C</div>
			</div>
		</form>

		<div class="calc-result">
			<div v-if="error" class="error">{{ error }}</div>
			<div v-else class="calc-result-card" style="gap: 12px">
				<div class="calc-result-value">
					<span class="calc-result-number">{{ resultDisplay }}</span> <span class="calc-result-unit">A</span>
				</div>
				<div class="calc-result-note">基于 IPC-2221 经验公式<br />嘉立创镀层厚度为0.018 mm</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { MIL_TO_MM, MM_TO_MIL } from '../utils/utils';
import { calculateViaCurrent } from '../utils/via';

const unit = ref<'mm' | 'mil'>('mm');
const d = ref<number | null>(0.3); // 过孔内径，默认 0.3 mm
const t = ref<number | null>(0.018); // 镀层厚度，默认 0.018 mm
const deltaT = ref<number | null>(30); // 允许温升，默认 30°C

/**
 * 切换单位并将已有输入值换算到目标单位
 * newUnit: 目标单位（'mm' 或 'mil'）
 */
const changeUnit = (newUnit: 'mm' | 'mil') => {
	if (newUnit === unit.value) return;

	if (d.value !== null && !isNaN(d.value)) {
		if (newUnit === 'mm') {
			// 当前值为 mil -> 转为 mm
			d.value = Number((d.value * MIL_TO_MM).toFixed(3));
		} else {
			// 当前值为 mm -> 转为 mil
			d.value = Number((d.value * MM_TO_MIL).toFixed(3));
		}
	}

	if (t.value !== null && !isNaN(t.value)) {
		if (newUnit === 'mm') {
			t.value = Number((t.value * MIL_TO_MM).toFixed(3));
		} else {
			t.value = Number((t.value * MM_TO_MIL).toFixed(3));
		}
	}

	unit.value = newUnit;
};

const toMM = (value: number | null) => {
	if (value === null || isNaN(value)) return null;
	return unit.value === 'mm' ? value : value * MIL_TO_MM;
};

const error = computed(() => {
	if (d.value === null || t.value === null || deltaT.value === null) return '请填写所有字段';
	if (isNaN(d.value) || isNaN(t.value) || isNaN(deltaT.value)) return '输入必须为数字';
	if (d.value <= 0) return '过孔内径必须大于 0';
	if (t.value <= 0) return '镀层厚度必须大于 0';
	if (deltaT.value <= 0) return '允许温升必须大于 0';
	return '';
});

const result = computed(() => {
	if (error.value) return null;
	const d_mm = toMM(d.value);
	const t_mm = toMM(t.value);
	if (d_mm === null || t_mm === null) return null;
	const current = calculateViaCurrent(d_mm, t_mm, deltaT.value as number);
	return current;
});

const resultDisplay = computed(() => {
	if (result.value === null) return '--';
	return result.value.toFixed(2);
});
</script>

<style scoped lang="scss">
@use '../styles/calculator-mixins.scss' as *;

.via-calculator {
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

	.calc-segmented {
		@include calc-segmented;

		button.active {
			background: #fff;
			font-weight: 600;

			@media (prefers-color-scheme: dark) {
				background: #404040;
				color: var(--calc-text);
				border: 1px solid rgba(255, 255, 255, 0.18);
				box-shadow: 0 10px 28px rgba(2, 6, 23, 0.55);
			}
		}
	}

	.calc-input {
		@include calc-input;
		border-radius: 8px;
		outline: none;

		&:focus {
			box-shadow: var(--calc-focus-ring);
			border-color: var(--calc-primary);
		}
	}

	.calc-field-suffix {
		@include calc-field-suffix;
	}

	.calc-result {
		@include calc-result;
		height: 66px; // 固定高度防止跳动
	}

	.calc-result-card {
		@include calc-result-card;
		padding: 10px 12px;
	}

	.calc-result-inner {
		@include calc-result-inner;
	}

	.calc-result-value {
		@include calc-result-value;
	}

	.calc-result-unit {
		@include calc-result-unit;
	}

	.calc-result-note {
		@include calc-result-note;
	}

	@include hide-number-input-controls;
	@include reduced-motion;
}
</style>
