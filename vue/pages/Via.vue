<template>
	<div class="via-calculator calculator-base">
		<header class="calc-header">
			<h3>过孔参数计算</h3>
		</header>

		<form @submit.prevent class="calc-form">
			<div class="calc-field">
				<label style="width: 120px">单位</label>
				<div class="unit-wrapper">
					<div class="calc-segmented">
						<button type="button" :class="{ active: unit === 'mm' }" @click="changeUnit('mm')">mm</button>
						<button type="button" :class="{ active: unit === 'mil' }"
							@click="changeUnit('mil')">mil</button>
					</div>


					<button type="button" :disabled="!isPcb" class="apply-pcb-btn"
						@click="mode === 'd2i' ? fromToPcb('fromPcb') : fromToPcb('toPcb')" :aria-disabled="!isPcb"
						:title="!isPcb ? '需要在 PCB 界面才能应用' : (mode === 'd2i' ? '从 PCB 读取选中过孔' : '计算结果应用到 PCB')">
						{{ mode === 'd2i' ? 'PCB读取过孔宽度' : '计算结果应用到PCB' }}
					</button>
				</div>
			</div>
			<div class="calc-field">
				<label style="width: 120px">模式</label>
				<div class="calc-segmented">
					<button type="button" :class="{ active: mode === 'd2i' }" @click="changeMode('d2i')">按内径算电流</button>
					<button type="button" :class="{ active: mode === 'i2d' }" @click="changeMode('i2d')">按电流算内径</button>
				</div>
			</div>
			<div class="calc-field" v-if="mode === 'd2i'">
				<label style="width: 120px">过孔内径</label>
				<input class="calc-input" style="width: 140px; min-width: 100px; padding: 8px" type="number"
					v-model.number="d" step="0.001" min="0" />
				<div class="calc-field-suffix" style="width: 48px">{{ unit }}</div>
			</div>

			<div class="calc-field" v-if="mode === 'i2d'">
				<label style="width: 120px">目标电流</label>
				<input class="calc-input" style="width: 140px; min-width: 100px; padding: 8px" type="number"
					v-model.number="targetCurrent" step="0.001" min="0" />
				<div class="calc-field-suffix" style="width: 48px">A</div>
			</div>

			<div class="calc-field">
				<label style="width: 120px">镀层厚度</label>
				<input class="calc-input" style="width: 140px; min-width: 100px; padding: 8px" type="number"
					v-model.number="t" step="0.001" min="0" />
				<div class="calc-field-suffix" style="width: 48px">{{ unit }}</div>
			</div>

			<div class="calc-field">
				<label style="width: 120px">允许温升</label>
				<input class="calc-input" style="width: 140px; min-width: 100px; padding: 8px" type="number"
					v-model.number="deltaT" step="0.1" min="0" />
				<div class="calc-field-suffix" style="width: 48px">°C</div>
			</div>
		</form>

		<div class="calc-result">
			<div v-if="error" class="error">{{ error }}</div>
			<div v-else class="calc-result-card" style="gap: 12px">
				<div class="calc-result-value">
					<span class="calc-result-number">{{ resultDisplay }}</span> <span class="calc-result-unit">{{
						resultUnit }}</span>
				</div>
				<div class="calc-result-note">基于 IPC-2221 经验公式<br />嘉立创镀层厚度为0.018 mm</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { isEDA, isPCB, MIL_TO_MM, MM_TO_MIL } from '../utils/utils';
import { calculateViaCurrent, calculateViaDiameterFromCurrent } from '../utils/via';
import { createAutoCancel } from '../utils/autoCancel';

const unit = ref<'mm' | 'mil'>('mm');
const d = ref<number | null>(0.3); // 过孔内径，默认 0.3 mm
const t = ref<number | null>(0.018); // 镀层厚度，默认 0.018 mm
const deltaT = ref<number | null>(30); // 允许温升，默认 30°C
const isPcb = ref(false);
const mode = ref<'d2i' | 'i2d'>('d2i');
const targetCurrent = ref<number | null>(3);

const loading = ref(false);

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

const changeMode = (m: 'd2i' | 'i2d') => {
	if (mode.value === m) return;
	mode.value = m;
};

const toMM = (value: number | null) => {
	if (value === null || isNaN(value)) return null;
	return unit.value === 'mm' ? value : value * MIL_TO_MM;
};

const emit = defineEmits<{
	(e: 'apply-to-pcb', payload: { d_mm: number | null; t_mm: number | null; deltaT: number | null }): void;
}>();

const fromToPcb = async (pcbMode: string) => {
	await eda.sys_IFrame.hideIFrame("Via");
	eda.sys_Message.showToastMessage('请选择 PCB 中的导线,选择完成后按 Enter 键确认', ESYS_ToastMessageType.INFO, 5);

	const key = ["Enter"] as unknown as TSYS_ShortcutKeys;
	await eda.sys_ShortcutKey.unregisterShortcutKey(key);

	const autoCancel = createAutoCancel(async () => {
		loading.value = false;
		try { await eda.sys_ShortcutKey.unregisterShortcutKey(key); } catch (e) { }
		try { await eda.sys_IFrame.showIFrame("Via"); } catch (e) { }
		eda.sys_Message.showToastMessage('读取/应用已取消', ESYS_ToastMessageType.ERROR, 5);
	}, 20000);

	await eda.sys_ShortcutKey.registerShortcutKey(key, "Via", async () => {
		console.log("Shortcut Key Pressed: Enter");
		autoCancel.start();
		loading.value = true;
		const selectedObjects = await eda.pcb_SelectControl.getAllSelectedPrimitives();

		const vias = Array.from(selectedObjects).filter(
			(el: IPCB_Primitive) => el.getState_PrimitiveType() === EPCB_PrimitiveType.VIA
		) as unknown as IPCB_PrimitiveVia[];
		let len = vias.length;
		if (len > 0) {
			if (pcbMode === "fromPcb") {
				const diameters_mm = vias.map(via => via.getState_HoleDiameter() * MIL_TO_MM);
				// 计算平均值
				const sum = diameters_mm.reduce((acc, val) => acc + val, 0);
				const avg = sum / len;
				// 根据当前单位更新 d.value
				d.value = unit.value === 'mm' ? Number(avg.toFixed(3)) : Number((avg * MM_TO_MIL).toFixed(2));
				eda.sys_Message.showToastMessage(`已从选中的 ${len} 个过孔读取内径，平均值为 ${d.value} ${unit.value}`, ESYS_ToastMessageType.SUCCESS, 5);

			} else {
				const tasks = vias.map(element => {
					const width = Number((result.value! * MM_TO_MIL).toFixed(2));
					element.setState_HoleDiameter(width);
					element.setState_Diameter(width + 9);
					return element.done();
				});
				await Promise.all(tasks);
				eda.sys_Message.showToastMessage(`已将计算得到的过孔内径应用到选中的 ${len} 个过孔`, ESYS_ToastMessageType.SUCCESS, 3);
			}
		} else {
			eda.sys_Message.showToastMessage('未选择任何导线', ESYS_ToastMessageType.WARNING, 5);
		}

		// 正常完成：取消定时器并清理
		autoCancel.cancel();
		loading.value = false;
		try { await eda.sys_ShortcutKey.unregisterShortcutKey(key); } catch (e) { }
		try { await eda.sys_IFrame.showIFrame("Via"); } catch (e) { }
	}, [4], [1, 2, 3, 4, 5, 6])

	// 启动超时保护
	autoCancel.start();

}

const error = computed(() => {
	// 模式不同，所需字段不同
	if (mode.value === 'd2i') {
		if (d.value === null || t.value === null || deltaT.value === null) return '请填写所有字段';
		if (isNaN(d.value) || isNaN(t.value) || isNaN(deltaT.value)) return '输入必须为数字';
		if (d.value <= 0) return '过孔内径必须大于 0';
	} else {
		if (targetCurrent.value === null || t.value === null || deltaT.value === null) return '请填写所有字段';
		if (isNaN(targetCurrent.value) || isNaN(t.value) || isNaN(deltaT.value)) return '输入必须为数字';
		if (targetCurrent.value <= 0) return '目标电流必须大于 0';
	}
	if (t.value === null || isNaN(t.value)) return '镀层厚度必须正确';
	if (t.value <= 0) return '镀层厚度必须大于 0';
	if (deltaT.value === null || isNaN(deltaT.value)) return '允许温升必须正确';
	if (deltaT.value <= 0) return '允许温升必须大于 0';
	return '';
});

const result = computed(() => {
	if (error.value) return null;
	const t_mm = toMM(t.value);
	if (t_mm === null) return null;

	if (mode.value === 'd2i') {
		const d_mm = toMM(d.value);
		if (d_mm === null) return null;
		return calculateViaCurrent(d_mm, t_mm, deltaT.value as number); // 返回电流 (A)
	}

	// i2d: 返回内径 (mm)
	const current = targetCurrent.value as number;
	return calculateViaDiameterFromCurrent(current, t_mm, deltaT.value as number);
});

const resultDisplay = computed(() => {
	if (result.value === null) return '--';
	if (mode.value === 'd2i') return (result.value as number).toFixed(2);
	// 内径显示，根据单位选择位数
	const d_mm = result.value as number;
	if (unit.value === 'mm') return d_mm.toFixed(3);
	return (d_mm * MM_TO_MIL).toFixed(2);
});

const resultUnit = computed(() => {
	return mode.value === 'd2i' ? 'A' : unit.value;
});

// 当模式为按电流算内径时，监听目标电流或相关参数变动，自动把计算结果写回输入框 d
watch([() => mode.value, () => targetCurrent.value, () => t.value, () => deltaT.value, () => unit.value], () => {
	if (mode.value !== 'i2d') return;
	if (error.value) return;
	const d_mm = result.value as number;
	if (d_mm == null || isNaN(d_mm)) return;
	// 将 mm 转为当前单位并更新 d.value
	d.value = unit.value === 'mm' ? Number(d_mm.toFixed(3)) : Number((d_mm * MM_TO_MIL).toFixed(3));
});

watch(
	loading,
	(newVal) => {
		if (isEDA) {
			if (newVal) {
				eda.sys_LoadingAndProgressBar.showLoading();
			} else {
				eda.sys_LoadingAndProgressBar.destroyLoading();
			}
		}
	},
	{ flush: 'sync' },
);

onMounted(async () => {
	if (isEDA) {
		isPcb.value = await isPCB()
	}
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

.unit-wrapper {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.apply-pcb-btn {
	@include calc-button-primary;
	position: absolute;
	top: 50%;
	right: -140px;
	transform: translateY(-50%);
	padding: 6px 10px;
	font-size: 12px;
	white-space: nowrap;
	z-index: 5;
}
</style>
