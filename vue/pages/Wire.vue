<template>
    <div class="wire-calculator calculator-base">
        <header class="calc-header">
            <h3>线宽载流计算</h3>
        </header>

        <form @submit.prevent class="calc-form">
            <div class="calc-field">
                <label style="width: 110px;">单位</label>
                <div class="calc-segmented">
                    <button type="button" :class="{ active: unit === 'mm' }" @click="changeUnit('mm')">mm</button>
                    <button type="button" :class="{ active: unit === 'mil' }" @click="changeUnit('mil')">mil</button>
                </div>
            </div>

            <div class="calc-field">
                <label style="width: 110px;">模式</label>
                <div class="calc-segmented">
                    <button type="button" :class="{ active: mode === 'width' }" @click="mode = 'width'">按线宽求电流</button>
                    <button type="button" :class="{ active: mode === 'current' }"
                        @click="mode = 'current'">按电流求线宽</button>
                </div>
            </div>

            <div class="calc-field">
                <label style="width: 110px;">层</label>
                <div class="calc-segmented">
                    <button type="button" :class="{ active: layer === 'outer' }" @click="layer = 'outer'">外层</button>
                    <button type="button" :class="{ active: layer === 'inner' }" @click="layer = 'inner'">内层</button>
                </div>
            </div>

            <div class="calc-field" v-if="mode === 'width'">
                <label style="width: 110px;">线宽</label>
                <input class="calc-input" style="width: 120px;" type="number" v-model.number="width" step="0.001"
                    min="0" :aria-label="`线宽 (${unit})`" />
                <div class="calc-field-suffix" style="width: 40px;">{{ unit }}</div>
            </div>

            <div class="calc-field" v-else>
                <label style="width: 110px;">目标电流</label>
                <input class="calc-input" style="width: 120px;" type="number" v-model.number="current" step="0.01"
                    min="0" aria-label="目标电流 (A)" />
                <div class="calc-field-suffix" style="width: 40px;">A</div>
            </div>

            <div class="calc-field">
                <label style="width: 110px;">铜厚</label>
                <select class="calc-select" style="width: 80px;" v-model="copperOpt"
                    :class="{ wide: copperOpt !== 'custom' }">
                    <option value="1oz">1oz (默认 外层)</option>
                    <option value="0.5oz">0.5oz (默认 内层)</option>
                    <option value="custom">自定义</option>
                </select>
                <input v-if="copperOpt === 'custom'" class="calc-input small" type="number"
                    v-model.number="customCopper" step="0.01" min="0" :aria-label="'自定义铜厚 (oz)'" />
                <div class="calc-field-suffix" style="width: 40px;" v-if="copperOpt === 'custom'">oz</div>
            </div>

            <div class="calc-field">
                <label style="width: 110px;">允许温升</label>
                <input class="calc-input" style="width: 120px;" type="number" v-model.number="deltaT" step="0.1" min="0"
                    aria-label="允许温升 (°C)" />
                <div class="calc-field-suffix" style="width: 40px;">°C</div>
            </div>

        </form>

        <div class="calc-result">
            <div v-if="error" class="error">{{ error }}</div>
            <div v-else class="calc-result-card" style="padding: 8px;">
                <div class="calc-result-value"><span class="calc-result-number">{{ resultDisplay }}</span> <span
                        class="calc-result-unit">{{ resultUnit
                        }}</span></div>
                <div class="calc-result-note">基于 IPC-2221 经验公式 <br>嘉立创默认外层铜厚1oz，内层0.5oz</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { calcTraceCurrent, solveWidthFromCurrent, DEFAULT_1OZ_MM, DEFAULT_0_5OZ_MM, DEFAULT_MANUFACTURABLE_MIN_MM } from '../utils/wire';
import { MM_TO_MIL, MIL_TO_MM } from '../utils/utils';

const unit = ref<'mm' | 'mil'>('mm');
const mode = ref<'width' | 'current'>('width');
const layer = ref<'outer' | 'inner'>('outer');

const width = ref<number | null>(0.5);
const current = ref<number | null>(1);
const copperOpt = ref<'1oz' | '0.5oz' | 'custom'>('1oz');
const customCopper = ref<number | null>(null);
const deltaT = ref<number | null>(30);

const changeUnit = (newUnit: 'mm' | 'mil') => {
    if (newUnit === unit.value) return;
    // convert displayed numeric inputs
    if (width.value !== null && !isNaN(width.value)) {
        width.value = newUnit === 'mm' ? Number((width.value * MIL_TO_MM).toFixed(3)) : Number((width.value * MM_TO_MIL).toFixed(3));
    }
    if (customCopper.value !== null && !isNaN(customCopper.value)) {
        customCopper.value = newUnit === 'mm' ? Number((customCopper.value * MIL_TO_MM).toFixed(3)) : Number((customCopper.value * MM_TO_MIL).toFixed(3));
    }
    unit.value = newUnit;
};

const copperThickness = computed(() => {
    if (copperOpt.value === '1oz') return DEFAULT_1OZ_MM;
    if (copperOpt.value === '0.5oz') return DEFAULT_0_5OZ_MM;
    // customCopper is entered in oz; convert to mm using DEFAULT_1OZ_MM per oz
    const oz = customCopper.value ?? 1;
    return oz * DEFAULT_1OZ_MM;
});

watch(layer, (val) => {
    if (val === 'outer') {
        copperOpt.value = '1oz';
        customCopper.value = null;
    } else {
        copperOpt.value = '0.5oz';
        customCopper.value = null;
    }
});

const error = computed(() => {
    if (mode.value === 'width') {
        if (width.value === null || isNaN(width.value)) return '请填写线宽';
        if (width.value <= 0) return '线宽必须大于 0';
    } else {
        if (current.value === null || isNaN(current.value)) return '请填写目标电流';
        if (current.value <= 0) return '电流必须大于 0';
    }
    if (copperThickness.value <= 0) return '铜厚必须大于 0';
    if (deltaT.value === null || isNaN(deltaT.value) || deltaT.value <= 0) return '允许温升必须大于 0';
    return '';
});

const isExternal = computed(() => layer.value === 'outer');

const result = computed(() => {
    if (error.value) return null;
    const thick_mm = copperThickness.value;
    const dT = deltaT.value as number;
    if (mode.value === 'width') {
        const w_mm = unit.value === 'mm' ? (width.value as number) : (width.value as number) * MIL_TO_MM;
        return calcTraceCurrent(w_mm, thick_mm, dT, isExternal.value);
    } else {
        const I = current.value as number;
        const solver = solveWidthFromCurrent(I, thick_mm, dT, isExternal.value, { minWidthMm: 1e-4, maxWidthMm: 100, tol: 1e-6 });
        if (!solver.converged || solver.width_mm === null) return { solverFailed: true } as any;
        return { width_mm: solver.width_mm } as any;
    }
});

const resultDisplay = computed(() => {
    if (result.value === null) return '--';
    if (mode.value === 'width') return (result.value as number).toFixed(2);
    const r = result.value as any;
    if (r.solverFailed) return '无法求解';
    const w = r.width_mm as number;
    return unit.value === 'mm' ? w.toFixed(3) : (w * MM_TO_MIL).toFixed(2);
});

const resultUnit = computed(() => mode.value === 'width' ? 'A' : unit.value);

const recommendedWidth = computed(() => {
    if (mode.value === 'width') return null;
    const r = result.value as any;
    if (!r || r.solverFailed || r.width_mm === null) return null;
    return Math.max(DEFAULT_MANUFACTURABLE_MIN_MM, r.width_mm);
});

const recommendedWidthDisplay = computed(() => {
    if (!recommendedWidth.value) return '';
    return unit.value === 'mm' ? `${recommendedWidth.value.toFixed(3)} mm` : `${(recommendedWidth.value * MM_TO_MIL).toFixed(2)} mil`;
});

const applyRecommended = () => {
    if (!recommendedWidth.value) return;
    const w_mm = recommendedWidth.value;
    width.value = unit.value === 'mm' ? w_mm : w_mm * MM_TO_MIL;
    mode.value = 'width';
};

// SVG preview removed

</script>

<style scoped lang="scss">
@use '../styles/calculator-mixins.scss' as *;

.wire-calculator {
    @include calculator-base;
    padding: 12px;

    .calc-header {
        @include calc-header;
    }

    .calc-form {
        @include calc-form;
        gap: 8px;
    }

    .calc-field {
        @include calc-field;
        flex-wrap: wrap;
    }

    .calc-segmented {
        @include calc-segmented;

        button.active {
            background: var(--calc-card);
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

        &.small {
            width: 80px;
        }
    }

    .calc-select {
        @include calc-select;
        width: 80px;

        &.wide {
            width: 140px;
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
        padding: 8px;
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
