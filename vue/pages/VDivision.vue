<template>
    <div class="vd-container">
        <!-- 主内容区 -->
        <div class="content-wrapper">
            <!-- 左侧 SVG 图 -->
            <div class="svg-wrapper" aria-hidden="false">
                <!-- 模式切换按钮组 - 位于SVG左下角 -->
                <div class="mode-switcher-overlay">
                    <button v-if="mode === 'reverse'" @click="showSettings = true" class="settings-btn">
                        参数设置
                    </button>
                    <div class="calc-segmented">
                        <button :class="{ active: mode === 'forward' }" @click="mode = 'forward'">
                            正向
                        </button>
                        <button :class="{ active: mode === 'reverse' }" @click="mode = 'reverse'">
                            反向
                        </button>
                    </div>

                </div>
                <svg viewBox="0 0 360 400" preserveAspectRatio="xMidYMid meet" class="diagram">
                    <defs>
                        <rect id="resistor-iec" x="-10" y="-30" width="20" height="60" fill="none" stroke-width="3"
                            stroke-linejoin="round" />
                    </defs>

                    <g fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round">
                        <!-- 主电源线 -->
                        <path d="M 120 40 L 120 100" />
                        <!-- R2下方到地的连接线 -->
                        <path d="M 120 300 L 120 360" />
                        <!-- 分压输出线 -->
                        <path d="M 120 220 L 180 220" />
                    </g>

                    <!-- R1电阻及其两端连接线 -->
                    <g transform="translate(120, 150)" fill="none" stroke="#008000" stroke-width="3"
                        stroke-linecap="round">
                        <!-- R1上端连接线 -->
                        <path d="M 0 -50 L 0 -30" />
                        <!-- R1电阻本体 -->
                        <use href="#resistor-iec" stroke="#008000" />
                        <!-- R1下端连接线，延伸到R2 -->
                        <path d="M 0 30 L 0 70" />
                    </g>

                    <!-- R2电阻及其两端连接线 -->
                    <g transform="translate(120, 270)" fill="none" stroke="#008000" stroke-width="3"
                        stroke-linecap="round">
                        <!-- R2上端连接线 -->
                        <path d="M 0 -50 L 0 -30" />
                        <!-- R2电阻本体 -->
                        <use href="#resistor-iec" stroke="#008000" />
                        <!-- R2下端连接线 -->
                        <path d="M 0 30 L 0 50" />
                    </g>

                    <circle cx="120" cy="40" r="6" fill="#dc2626" />
                    <foreignObject x="130" y="22" width="60" height="32">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <input type="number" v-model.number="vin" step="0.01" class="svg-input vin-input"
                                :readonly="mode === 'reverse'" placeholder="12" />
                        </div>
                    </foreignObject>
                    <text x="195" y="42" font-size="12" fill="#3b82f6">V</text>
                    <text x="130" y="70" font-size="14" fill="#3b82f6" font-weight="black">输入电压</text>

                    <!-- R1标签和输入框 -->
                    <text x="90" y="155" text-anchor="middle" font-size="16" fill="var(--calc-text)"
                        font-weight="bold">R1</text>
                    <foreignObject x="145" y="134" width="60" height="32">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <input type="text" :value="formatResistance(r1).replace('Ω', '')" class="svg-input r-input"
                                :readonly="mode === 'reverse'" @input="updateR1" placeholder="1M" />
                        </div>
                    </foreignObject>
                    <text x="210" y="148" font-size="12" fill="#008000" opacity="0.8">Ω</text>

                    <!-- R2标签和输入框 -->
                    <text x="90" y="275" text-anchor="middle" font-size="16" fill="var(--calc-text)"
                        font-weight="bold">R2</text>
                    <foreignObject x="145" y="254" width="60" height="32">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <input type="text" :value="formatResistance(r2).replace('Ω', '')" class="svg-input r-input"
                                :readonly="mode === 'reverse'" @input="updateR2" placeholder="10k" />
                        </div>
                    </foreignObject>
                    <text x="210" y="268" font-size="12" fill="#008000" opacity="0.8">Ω</text>
                    <!-- 分压点（高图层，在电阻之上显示） -->
                    <circle cx="120" cy="220" r="4" fill="#dc2626" stroke="none" />
                    <circle cx="180" cy="220" r="5" fill="#dc2626" />
                    <foreignObject x="190" y="204" width="60" height="32">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            <input type="number" :value="mode === 'forward' ? vout.toFixed(3) : vtarget.toFixed(3)"
                                :readonly="mode === 'forward'" @input="updateVtarget" class="svg-input vout-input"
                                :placeholder="mode === 'forward' ? '0.119' : '6.0'" />
                        </div>
                    </foreignObject>
                    <text x="255" y="222" font-size="12" fill="#3b82f6">V</text>
                    <text x="190" y="195" font-size="14" fill="#3b82f6" font-weight="black">输出电压</text>

                    <g transform="translate(105, 360)">
                        <path d="M 0 0 h 30 M 5 6 h 20 M 10 12 h 10" stroke="#008000" stroke-width="3"
                            stroke-linecap="round" />
                    </g>
                </svg>
            </div>

            <!-- 右侧信息区 -->
            <div class="info-panel">
                <!-- 正向模式：显示电路参数 -->
                <div v-if="mode === 'forward'" class="forward-info">
                    <h3>电路参数</h3>
                    <div class="param-grid">
                        <div class="param-card">
                            <div class="param-title">输出</div>
                            <div class="param-value primary">{{ vout.toFixed(3) }}V</div>
                            <div class="param-sub">{{ (vout / vin * 100).toFixed(1) }}%</div>
                        </div>
                        <div class="param-card">
                            <div class="param-title">电流</div>
                            <div class="param-value">{{ (current * 1000).toFixed(1) }}mA</div>
                            <div class="param-sub">{{ formatResistance(rth) }}</div>
                        </div>
                        <div class="param-card">
                            <div class="param-title">R1功耗</div>
                            <div class="param-value">{{ formatPower(powerR1) }}</div>
                        </div>
                        <div class="param-card">
                            <div class="param-title">R2功耗</div>
                            <div class="param-value">{{ formatPower(powerR2) }}</div>
                        </div>
                        <div class="param-card">
                            <div class="param-title">总功耗</div>
                            <div class="param-value">{{ formatPower(powerTotal) }}</div>
                        </div>
                    </div>
                </div>

                <!-- 反向模式：显示结果列表 -->
                <div v-else class="reverse-info">
                    <h3>反向枚举</h3>

                    <div class="results-section">
                        <div class="results-header">
                            <span>找到 {{ results.length }} 个组合</span>
                            <button @click="calculateReverse" class="refresh-btn" :disabled="isCalculating">
                                {{ isCalculating ? '计算中...' : '刷新' }}
                            </button>
                        </div>

                        <div class="results-list" v-if="results.length > 0">
                            <div v-for="(result, index) in results" :key="index" class="result-item"
                                :class="{ selected: selectedIndex === index }" @click="selectResult(index)">
                                <div class="result-main">
                                    <span class="resistors">
                                        {{ formatResistance(result.r1) }} / {{ formatResistance(result.r2) }}
                                    </span>
                                    <span class="voltage">{{ result.vout.toFixed(3) }}V</span>
                                </div>
                                <div class="result-details">
                                    <span class="error">误差: {{ result.error.toFixed(2) }}{{ config.errorMode ===
                                        'percent' ? '%' : 'V' }}</span>
                                    <span class="power">{{ formatPower(result.powerTotal) }}</span>
                                </div>
                            </div>
                        </div>

                        <div v-else class="no-results">
                            <p>未找到符合条件的阻值组合</p>
                            <p class="hint">请调整参数设置</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 参数设置对话框 -->
        <div v-if="showSettings" class="dialog-overlay" @click.self="showSettings = false">
            <div class="dialog">
                <div class="dialog-header">
                    <h3>参数设置</h3>
                    <button @click="showSettings = false" class="close-btn">×</button>
                </div>
                <div class="dialog-body">
                    <div class="setting-group">
                        <label>阻值系列：</label>
                        <select v-model="config.series" class="calc-select">
                            <option value="E6">E6 (20%)</option>
                            <option value="E12">E12 (10%)</option>
                            <option value="E24">E24 (5%)</option>
                            <option value="E48">E48 (2%)</option>
                            <option value="E96">E96 (1%)</option>
                            <option value="E192">E192 (0.5%)</option>
                            <option value="ALL">混合所有</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label>阻值范围：</label>
                        <div class="range-inputs">
                            <input type="text" :value="formatResistance(config.minR).replace('Ω', '')"
                                class="calc-input"
                                @input="(e) => config.minR = parseResistance((e.target as HTMLInputElement).value)" />
                            <span>到</span>
                            <input type="text" :value="formatResistance(config.maxR).replace('Ω', '')"
                                class="calc-input"
                                @input="(e) => config.maxR = parseResistance((e.target as HTMLInputElement).value)" />
                        </div>
                    </div>

                    <div class="setting-group">
                        <label>戴维南阻抗范围：</label>
                        <div class="range-inputs">
                            <input type="text" :value="formatResistance(config.minRth).replace('Ω', '')"
                                class="calc-input"
                                @input="(e) => config.minRth = parseResistance((e.target as HTMLInputElement).value)" />
                            <span>到</span>
                            <input type="text" :value="formatResistance(config.maxRth).replace('Ω', '')"
                                class="calc-input"
                                @input="(e) => config.maxRth = parseResistance((e.target as HTMLInputElement).value)" />
                        </div>
                    </div>

                    <div class="setting-group">
                        <label>误差限制：</label>
                        <div class="error-settings">
                            <select v-model="config.errorMode" class="calc-select">
                                <option value="percent">百分比误差</option>
                                <option value="absolute">绝对电压误差</option>
                            </select>
                            <span>{{ config.errorMode === 'percent' ? '%' : 'V' }}</span>
                            <input type="number" v-model.number="config.errorValue" class="calc-input"
                                :step="config.errorMode === 'percent' ? '0.1' : '0.001'" />
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button @click="resetSettings" class="btn-secondary">重置默认值</button>
                    <button @click="applySettings" class="btn-primary">应用设置</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
    calcVout,
    calcCurrent,
    calcPowerR1,
    calcPowerR2,
    calcTheveninResistance,
    enumerateResistorsCombinations,
    formatResistance,
    formatPower,
    parseResistance
} from '../utils/voltageDivider'
import { EnumerationConfig, ErrorMode, ResistorResult, ResistorSeries } from '../types/voltageDivider'

// 响应式数据
const mode = ref<'forward' | 'reverse'>('forward')
const vin = ref(12)
const r1 = ref(10000)
const r2 = ref(10000)
const vtarget = ref(6)

const showSettings = ref(false)
const isCalculating = ref(false)
const selectedIndex = ref<number | null>(null)
const results = ref<ResistorResult[]>([])

const config = ref<EnumerationConfig>({
    series: 'E96' as ResistorSeries,
    minR: 10000,
    maxR: 1000000,
    minRth: 0,
    maxRth: 10000000,
    errorMode: 'percent' as ErrorMode,
    errorValue: 1
})

// 正向计算结果
const vout = computed(() => calcVout(vin.value, r1.value, r2.value))
const current = computed(() => calcCurrent(vin.value, r1.value, r2.value))
const powerR1 = computed(() => calcPowerR1(vin.value, r1.value, r2.value))
const powerR2 = computed(() => calcPowerR2(vin.value, r1.value, r2.value))
const powerTotal = computed(() => powerR1.value + powerR2.value)
const rth = computed(() => calcTheveninResistance(r1.value, r2.value))

// 输入处理函数
const updateR1 = (event: Event) => {
    const target = event.target as HTMLInputElement
    r1.value = parseResistance(target.value)
}

const updateR2 = (event: Event) => {
    const target = event.target as HTMLInputElement
    r2.value = parseResistance(target.value)
}

const updateVtarget = (event: Event) => {
    const target = event.target as HTMLInputElement
    vtarget.value = parseFloat(target.value) || 0
}

// 反向计算
const calculateReverse = () => {
    if (mode.value !== 'reverse' || !vin.value || !vtarget.value) return

    isCalculating.value = true
    selectedIndex.value = null

    // 使用 nextTick 让 UI 更新
    nextTick(() => {
        results.value = enumerateResistorsCombinations(vin.value, vtarget.value, config.value)
        isCalculating.value = false
    })
}

// 选择结果
const selectResult = (index: number) => {
    selectedIndex.value = index
    const result = results.value[index]
    if (result) {
        r1.value = result.r1
        r2.value = result.r2
        mode.value = 'forward'
    }
}

// 设置对话框操作
const resetSettings = () => {
    Object.assign(config.value, {
        series: 'E96' as ResistorSeries,
        minR: 10000,
        maxR: 1000000,
        minRth: 0,
        maxRth: 10000000,
        errorMode: 'percent' as ErrorMode,
        errorValue: 1
    })
}

const applySettings = () => {
    showSettings.value = false
    calculateReverse()
}

// 监听模式变化
watch(mode, (newMode) => {
    if (newMode === 'reverse') {
        calculateReverse()
    }
})

// 监听 vin 和 vtarget 变化
watch([vin, vtarget], () => {
    if (mode.value === 'reverse') {
        calculateReverse()
    }
})

// 监听模式变化时自动计算
watch(mode, (newMode) => {
    if (newMode === 'reverse') calculateReverse()
})

// 监听输入变化时重新计算（仅反向模式）
watch([vin, vtarget], () => {
    if (mode.value === 'reverse') calculateReverse()
})
</script>

<style scoped lang="scss">
@use '../styles/calculator-mixins.scss' as *;

.vd-container {
    @include calculator-base;
    max-width: 600px;
    padding: 16px;
    box-shadow: var(--calc-shadow);
}

.content-wrapper {
    display: flex;
    gap: 16px;
}

.svg-wrapper {
    position: relative;
    width: 320px;
    height: 380px;
    flex: 0 0 320px;
    overflow: hidden;
    border: 1px solid var(--calc-border);
    border-radius: 8px;
    box-sizing: border-box;
    background: var(--calc-card);
}

.mode-switcher-overlay {
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 8px;

    .calc-segmented {
        @include calc-segmented;

        button {
            padding: 4px 8px;
            font-size: 12px;

            &.active {
                background: var(--calc-primary);
                color: white;
            }
        }
    }

    .settings-btn {
        padding: 4px 6px;
        border: 1px solid var(--calc-border);
        border-radius: 4px;
        background: var(--calc-card);
        color: var(--calc-text);
        cursor: pointer;
        font-size: 12px;

        &:hover {
            background: var(--calc-refresh-hover-bg);
        }
    }
}

.diagram {
    width: 100%;
    height: 100%;
    display: block;
}

.svg-input {
    @include calc-input;
    width: 100%;
    text-align: center;
    font-size: 13px;
    padding: 6px;

    &:read-only {
        background: rgba(0, 0, 0, 0.05);
        cursor: not-allowed;

        @media (prefers-color-scheme: dark) {
            background: rgba(255, 255, 255, 0.05);
        }
    }
}

.info-panel {
    flex: 1;
    min-width: 0;
    max-width: 400px;
    height: 380px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.forward-info,
.reverse-info {
    @include calc-header;
    height: 100%;
    display: flex;
    flex-direction: column;

    h3 {
        margin-bottom: 16px;
        color: var(--calc-text);
        flex-shrink: 0;
    }
}

.param-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    flex: 1;
    align-content: start;
}

.param-card {
    background: var(--calc-card);
    border: 1px solid var(--calc-border);
    border-radius: 8px;
    padding: 12px;
    text-align: center;

    .param-title {
        font-size: 12px;
        color: var(--calc-muted);
        margin-bottom: 4px;
    }

    .param-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--calc-text);
        margin-bottom: 2px;

        &.primary {
            color: var(--calc-primary);
            font-size: 20px;
        }
    }

    .param-sub {
        font-size: 11px;
        color: var(--calc-muted);
    }

    &:first-child {
        grid-column: 1 / -1;

        .param-value {
            font-size: 24px;
        }
    }
}

.results-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        flex-shrink: 0;

        span {
            color: var(--calc-muted);
            font-size: var(--font-size-base);
        }

        .refresh-btn {
            padding: 6px 12px;
            border: 1px solid var(--calc-border);
            border-radius: 6px;
            background: var(--calc-card);
            color: var(--calc-text);
            cursor: pointer;

            &:hover:not(:disabled) {
                background: var(--calc-refresh-hover-bg);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }
    }

    .results-list {
        flex: 1;
        overflow-y: auto;
        border: 1px solid var(--calc-border);
        border-radius: 6px;

        .result-item {
            padding: 10px;
            border-bottom: 1px solid var(--calc-border);
            cursor: pointer;
            transition: background 0.15s ease;
            color: var(--calc-text);

            &:hover {
                background: var(--calc-row-hover);
            }

            &.selected {
                background: var(--calc-primary);
                color: white;
            }

            &:last-child {
                border-bottom: none;
            }

            .result-main {
                display: flex;
                justify-content: space-between;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .result-details {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                opacity: 0.8;
            }
        }
    }

    .no-results {
        text-align: center;
        padding: 32px 16px;
        color: var(--calc-muted);
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;

        p {
            color: var(--calc-muted);
        }

        .hint {
            font-size: 12px;
            margin-top: 8px;
            color: var(--calc-muted);
        }
    }
}


// 对话框样式
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.dialog {
    background: var(--calc-bg);
    border-radius: 8px;
    box-shadow: var(--calc-shadow);
    min-width: 360px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;

    .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid var(--calc-border);

        h3 {
            margin: 0;
            color: var(--calc-text);
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--calc-muted);

            &:hover {
                color: var(--calc-text);
            }
        }
    }

    .dialog-body {
        padding: 12px;
        max-height: 50vh;
        overflow-y: auto;

        .setting-group {
            margin-bottom: 12px;

            label {
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: var(--calc-text);
            }

            .calc-select,
            .calc-input {
                @include calc-select;
                @include calc-input;
                width: 100%;
            }

            .range-inputs,
            .error-settings {
                display: flex;
                align-items: center;
                gap: 8px;

                input,
                select {
                    flex: 1;
                }

                span {
                    color: var(--calc-muted);
                    font-size: var(--font-size-base);
                }
            }
        }
    }

    .dialog-footer {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid var(--calc-border);
        justify-content: flex-end;

        button {
            padding: 8px 16px;
            border: 1px solid var(--calc-border);
            border-radius: 6px;
            cursor: pointer;

            &.btn-secondary {
                background: var(--calc-card);
                color: var(--calc-text);

                &:hover {
                    background: var(--calc-refresh-hover-bg);
                }
            }

            &.btn-primary {
                background: var(--calc-primary);
                color: white;
                border-color: var(--calc-primary);

                &:hover {
                    background: var(--calc-primary);
                    opacity: 0.9;
                }
            }
        }
    }
}

@include hide-number-input-controls;
@include reduced-motion;
</style>
