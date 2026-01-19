<template>
    <div class="placement-container calculator-base">
        <header class="calc-header">
            <h3>一键放置</h3>
        </header>

        <div class="placement-layout">
            <!-- 左侧：放置类型选择 -->
            <div class="placement-selector">
                <div class="selector-title">放置类型</div>
                <div class="selector-tabs" role="tablist" aria-label="放置类型">
                    <button v-for="type in placementTypes" :key="type.value" type="button" role="tab"
                        :id="'tab-' + type.value" :aria-selected="selectedPlacementType === type.value"
                        :aria-controls="'panel-' + type.value"
                        :class="['selector-tab', { active: selectedPlacementType === type.value }]"
                        @click="selectedPlacementType = type.value">
                        {{ type.label }}
                    </button>
                </div>
            </div>

            <!-- 右侧：参数面板 -->
            <div class="placement-params">
                <div v-if="!selectedPlacementType" class="params-empty">
                    <p>选择放置类型</p>
                </div>

                <form v-else @submit.prevent class="placement-form">
                    <div class="form-body">
                        <!-- 特殊参数：Type-C -->
                        <div v-if="selectedPlacementType === 'typec'" class="param-section" id="panel-typec"
                            role="tabpanel" :aria-labelledby="'tab-typec'">
                            <div class="section-title">Type-C 放置参数</div>
                            <!-- <div class="section-desc">Type-C 常用选项：是否放置 CC 电阻以支持 CC/PD 检测，及电阻封装选择（影响可焊性与布局）。</div> -->

                            <div class="form-row">
                                <label class="form-label" for="cc-res">CC 5.1k 电阻</label>
                                <div style="display: flex; align-items: center; gap: 8px">
                                    <input id="cc-res" type="checkbox" v-model="needCCRes" :aria-checked="needCCRes" />
                                </div>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="ccResPackage">CC 电阻封装</label>
                                <select id="ccResPackage" class="calc-input compact" v-model="ccResPackage"
                                    :disabled="!needCCRes" :aria-disabled="!needCCRes">
                                    <option value="0402">0402</option>
                                    <option value="0603">0603</option>
                                    <option value="0805">0805</option>
                                </select>
                            </div>
                        </div>

                        <!-- 特殊参数：LED -->
                        <div v-if="selectedPlacementType === 'led'" class="param-section" id="panel-led" role="tabpanel"
                            :aria-labelledby="'tab-led'">
                            <div class="section-title">LED 放置参数</div>
                            <!-- <div class="section-desc">选择 LED 颜色与限流电阻放置位置（上：靠近正极， 下：靠近地），以及LED和电阻封装。</div> -->

                            <div class="form-row">
                                <label class="form-label" for="ledColor">LED颜色</label>
                                <select id="ledColor" class="calc-input compact" v-model="ledColor">
                                    <option value="red">红</option>
                                    <option value="green">绿</option>
                                    <option value="blue">蓝</option>
                                    <option value="white">白</option>
                                    <option value="yellow">黄</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="ledResPosition">限流电阻位置</label>
                                <select id="ledResPosition" class="calc-input compact" v-model="ledResPosition">
                                    <option :value="0">上</option>
                                    <option :value="1">下</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="ledResValue">电阻阻值</label>
                                <select id="ledResValue" class="calc-input compact" v-model="ledResValue">
                                    <option value="4.7k">4.7k</option>
                                    <option value="5.1k">5.1k</option>
                                    <option value="10k">10k</option>
                                    <option value="100k">100k</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="ledResPackage">封装大小</label>
                                <select id="ledResPackage" class="calc-input compact" v-model="ledResPackage">
                                    <option value="0402">0402</option>
                                    <option value="0603">0603</option>
                                    <option value="0805">0805</option>
                                </select>
                            </div>
                        </div>

                        <!-- 特殊参数：I2C 电阻 -->
                        <div v-if="selectedPlacementType === 'i2c'" class="param-section" id="panel-i2c" role="tabpanel"
                            :aria-labelledby="'tab-i2c'">
                            <div class="section-title">I2C 电阻</div>

                            <div class="form-row">
                                <label class="form-label" for="i2cResValue">电阻阻值</label>
                                <select id="i2cResValue" class="calc-input compact" v-model="i2cResValue">
                                    <option value="4.7k">4.7k</option>
                                    <option value="5.1k">5.1k</option>
                                    <option value="10k">10k</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="i2cResPackage">封装大小</label>
                                <select id="i2cResPackage" class="calc-input compact" v-model="i2cResPackage">
                                    <option value="0402">0402</option>
                                    <option value="0603">0603</option>
                                    <option value="0805">0805</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="i2cPullVoltage">上拉电压</label>
                                <select id="i2cPullVoltage" class="calc-input compact" v-model="i2cPullVoltage">
                                    <option value="VCC">VCC</option>
                                    <option value="3.3V">3.3V</option>
                                    <option value="3V3">3V3</option>
                                    <option value="5V">5V</option>
                                </select>
                            </div>

                            <div class="form-row">
                                <label class="form-label" for="i2cNamePrefix">命名前缀</label>
                                <input id="i2cNamePrefix" class="calc-input compact short" type="text"
                                    v-model="i2cNamePrefix" placeholder="默认无（留空）" />
                            </div>
                        </div>
                    </div>

                    <!-- 操作按钮 固定底部 -->
                    <div class="form-actions">
                        <button type="button" class="btn-primary" @click="handlePlacement">放置</button>
                        <button type="button" class="btn-secondary" @click="handleReset">重置</button>
                    </div>

                    <!-- 结果提示（已移除） -->
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { isEDA, isSCH } from '../utils/utils';
import { placeTwoEndedComponent, zoom, zoomToBBoxes } from '../utils/oneclickplace';
import type { PlaceTwoEndedResult } from '../utils/oneclickplace';
import { NetFLAG, NetPort } from '../types/oneclickplace';
import { getLcId, ResistorFootprint, ResistorValue } from '../types/resistors';
import { getLedId, LedColor } from '../types/leds';

// 放置类型列表（精简为项目常用）
const placementTypes = [
    { value: 'typec', label: 'Type-C' },
    { value: 'led', label: 'LED' },
    { value: 'i2c', label: 'I2C上拉' },
];

const selectedPlacementType = ref<string>('');

// Type-C 特定参数
const needCCRes = ref<boolean>(true);
const ccResPackage = ref<string>('0603');

// LED 特定参数
const ledColor = ref<LedColor>('white');
const ledResPosition = ref<number>(0); // 上 / 下
const ledResPackage = ref<string>('0603');
const ledResValue = ref<string>('4.7k');
// I2C 电阻参数
const i2cResValue = ref<string>('4.7k');
const i2cResPackage = ref<string>('0603');
const i2cNamePrefix = ref<string>('');
const i2cPullVoltage = ref<string>('3.3V');

const loading = ref(false);
/**
 * 验证输入
 */
const validateInputs = computed(() => {
    if (!selectedPlacementType.value) return '请选择放置类型';

    // Type-specific validations
    if (selectedPlacementType.value === 'typec') {
        if (needCCRes.value && !ccResPackage.value) return '请选择 CC 电阻封装';
    }
    if (selectedPlacementType.value === 'led') {
        if (!ledColor.value) return '请选择 LED 颜色';
        if (!ledResValue.value) return '请选择限流电阻阻值';
        if (!ledResPackage.value) return '请选择限流电阻封装';
    }
    if (selectedPlacementType.value === 'i2c') {
        if (!i2cResValue.value) return '请选择 I2C 电阻阻值';
        if (!i2cResPackage.value) return '请选择 I2C 电阻封装';
        if (!i2cPullVoltage.value) return '请选择 I2C 上拉电压';
    }
    return '';
});

const typec = async (libraryUuid: string, position: { x: number; y: number; }): Promise<boolean> => {
    try {
        if (needCCRes.value) {
            const pkg = ccResPackage.value! as ResistorFootprint;
            const id = getLcId(pkg, '5.1k');
            if (!id) {
                console.error('CC 电阻库 ID 未找到', pkg);
                eda.sys_Message.showToastMessage('找不到对应的 CC 电阻封装或阻值', ESYS_ToastMessageType.ERROR, 5);
                return false;
            }

            const typecRes = await placeTwoEndedComponent("C2765186", libraryUuid, position.x, position.y, 0, null);
            if (!typecRes || !typecRes.component) {
                console.error('Type-C 接口放置失败');
                eda.sys_Message.showToastMessage('Type-C 接口放置失败', ESYS_ToastMessageType.ERROR, 5);
                return false;
            }
            const primitiveIds = [typecRes.component.getState_PrimitiveId()];
            typecRes.pins.forEach(async pin => {
                let pinName = pin.name;
                if (pinName === 'SHELL') {
                    pinName = 'GND';
                } else if (pinName?.includes('SBU')) {
                    return;
                } else if (pinName?.includes('DP')) {
                    pinName = 'DP';
                } else if (pinName?.includes('DN')) {
                    pinName = 'DM';
                }
                console.log('Processing pin:', pinName);
                const x = pin.x;
                const y = pin.y;
                const rotation = 180 - pin.rotation;

                const [net, line] = await Promise.all([
                    eda.sch_PrimitiveComponent.createNetPort('IN', pinName, x, y, rotation),
                    eda.sch_PrimitiveWire.create([x, y, x, y]),
                ]);
                const netPrimitiveId = net?.getState_PrimitiveId();
                if (netPrimitiveId) {
                    primitiveIds.push(netPrimitiveId);
                }
            });

            const placedResistor1 = await placeTwoEndedComponent(id, libraryUuid, position.x, position.y - 100, 0, [
                { name: 'CC1', type: NetPort.IN },
                { name: 'GND', type: NetFLAG.GROUND },
            ]) as PlaceTwoEndedResult | null;
            const placedResistor2 = await placeTwoEndedComponent(id, libraryUuid, position.x, position.y - 150, 0, [
                { name: 'CC2', type: NetPort.IN },
                { name: 'GND', type: NetFLAG.GROUND },
            ]) as PlaceTwoEndedResult | null;
            if (!placedResistor1 || !placedResistor1.component || !placedResistor2 || !placedResistor2.component) {
                console.error('CC 电阻放置失败');
                eda.sys_Message.showToastMessage('CC 电阻放置失败', ESYS_ToastMessageType.ERROR, 5);
                return false;
            }

            // zoom([placedResistor.component.getState_PrimitiveId()]);
            eda.sch_SelectControl.doSelectPrimitives([...placedResistor1.primitiveIds, ...placedResistor2.primitiveIds, ...primitiveIds]);
            eda.sys_Message.showToastMessage('Type-C CC 电阻放置完成', ESYS_ToastMessageType.SUCCESS, 3);
            console.log('Type-C CC 电阻放置完成');
            return true;
        }
        return false;
    } catch (err) {
        console.error('Type-C 放置时出错', err);
        eda.sys_Message.showToastMessage('Type-C 放置时发生错误', ESYS_ToastMessageType.ERROR, 5);
        return false;
    }
};

const led = async (libraryUuid: string, position: { x: number; y: number; }): Promise<boolean> => {
    try {
        const pkg = ledResPackage.value! as ResistorFootprint;
        const val = ledResValue.value! as ResistorValue;
        const resId = getLcId(pkg, val);
        const ledColorStr = ledColor.value! as LedColor;
        const ledId = getLedId(pkg, ledColorStr);
        if (!resId || !ledId) {
            console.error('找不到对应的 LED 或限流电阻封装或阻值', pkg, val);
            eda.sys_Message.showToastMessage('找不到对应的 LED 或限流电阻封装或阻值', ESYS_ToastMessageType.ERROR, 5);
            return false;
        }

        const placedLed = await placeTwoEndedComponent(ledId, libraryUuid, position.x, position.y, -90, null) as PlaceTwoEndedResult | null;
        if (!placedLed?.component) {
            console.error('LED 放置失败');
            eda.sys_Message.showToastMessage('LED 放置失败', ESYS_ToastMessageType.ERROR, 5);
            return false;
        }

        const placedResistor = await placeTwoEndedComponent(resId, libraryUuid, -10000, -10000, 90, null) as PlaceTwoEndedResult | null;
        if (!placedResistor?.component) {
            console.error('LED 限流电阻放置失败');
            eda.sys_Message.showToastMessage('LED 限流电阻放置失败', ESYS_ToastMessageType.ERROR, 5);
            return false;
        }

        // 选择要对齐的两个引脚：
        // - 当 ledResPosition === 0（电阻在上方）时，电阻的下端（最大 y）对齐到 LED 的上端（最小 y）
        // - 当 ledResPosition === 1（电阻在下方）时，电阻的上端（最小 y）对齐到 LED 的下端（最大 y）
        const ledPins = placedLed.pins || [];
        const resPins = placedResistor.pins || [];
        if (!ledPins.length || !resPins.length) {
            console.error('组件引脚信息不完整，无法对齐');
            eda.sys_Message.showToastMessage('组件引脚信息不完整，无法对齐', ESYS_ToastMessageType.ERROR, 5);
            return false;
        }

        // NOTE: 这里将分支反转以修正 UI 选择与实际行为相反的问题。
        // 当 ledResPosition === 0（UI 显示“上”）时，实际按“下”处理；当 === 1（UI 显示“下”）时，按“上”处理。
        const ledPin = ledResPosition.value === 1
            ? ledPins.reduce((p, c) => (p.y <= c.y ? p : c)) // LED 上端（最小 y）
            : ledPins.reduce((p, c) => (p.y >= c.y ? p : c)); // LED 下端（最大 y）

        const resPin = ledResPosition.value === 1
            ? resPins.reduce((p, c) => (p.y >= c.y ? p : c)) // 电阻下端（最大 y）
            : resPins.reduce((p, c) => (p.y <= c.y ? p : c)); // 电阻上端（最小 y）

        const baseResX = placedResistor.component.getState_X();
        const baseResY = placedResistor.component.getState_Y();

        const newX = baseResX + (ledPin.x - resPin.x);
        const newY = baseResY + (ledPin.y - resPin.y);

        // 移动电阻到对齐位置
        await eda.sch_PrimitiveComponent.modify(placedResistor.component.getState_PrimitiveId(), {
            ...placedResistor.component,
            x: newX,
            y: newY,
        },);

        // 计算移动后的电阻引脚位置（用于连线）
        const deltaX = newX - baseResX;
        const deltaY = newY - baseResY;
        const movedResPinX = resPin.x + deltaX;
        const movedResPinY = resPin.y + deltaY;

        // 创建一条从 LED 引脚到移动后电阻引脚的连线（比零长度连线更直观）
        await eda.sch_PrimitiveWire.create([ledPin.x, ledPin.y, movedResPinX, movedResPinY]);

        // zoom([placedResistor.component.getState_PrimitiveId(), placedLed.component.getState_PrimitiveId()]);

        eda.sch_SelectControl.doSelectPrimitives([...placedResistor.primitiveIds, ...placedLed.primitiveIds]);
        eda.sys_Message.showToastMessage('LED 放置完成', ESYS_ToastMessageType.SUCCESS, 3);
        return true;
    } catch (err) {
        console.error('LED 放置时出错', err);
        eda.sys_Message.showToastMessage('LED 放置时发生错误', ESYS_ToastMessageType.ERROR, 5);
        return false;
    }
}

const i2c = async (libraryUuid: string, position: { x: number; y: number; }): Promise<boolean> => {
    const pkg = i2cResPackage.value! as ResistorFootprint;
    const val = i2cResValue.value! as ResistorValue;
    const id = getLcId(pkg, val);
    if (!id) {
        console.error('I2C 电阻库 ID 未找到', pkg, val);
        eda.sys_Message.showToastMessage('找不到对应的电阻封装或阻值', ESYS_ToastMessageType.ERROR, 5);
        return false;
    }
    const resistors = await Promise.all([
        placeTwoEndedComponent(id, libraryUuid, position.x, position.y, 0, [
            { name: `${i2cNamePrefix.value}SDA`, type: NetPort.IN },
            { name: `${i2cPullVoltage.value}`, type: NetFLAG.POWER },
        ]),
        placeTwoEndedComponent(id, libraryUuid, position.x, position.y - 50, 0, [
            { name: `${i2cNamePrefix.value}SCL`, type: NetPort.IN },
            { name: `${i2cPullVoltage.value}`, type: NetFLAG.POWER },
        ]),
    ]) as Array<PlaceTwoEndedResult | null>;
    for (const res of resistors) {
        if (!res || !res.component) {
            console.error('I2C 电阻放置失败');
            eda.sys_Message.showToastMessage('I2C 电阻放置失败', ESYS_ToastMessageType.ERROR, 5);
            return false;
        }
    }

    // zoomToBBoxes(resistors.map(r => r!.bbox!));
    eda.sch_SelectControl.doSelectPrimitives(resistors.flatMap(r => r!.primitiveIds));
    eda.sys_Message.showToastMessage('I2C 电阻放置完成', ESYS_ToastMessageType.SUCCESS, 3);
    console.log('I2C 电阻放置完成');
    return true;
}

/**
 * 处理放置操作
 */
const handlePlacement = async () => {
    if (!(await isSCH())) {
        eda.sys_Message.showToastMessage('当前不在原理图编辑环境中，无法放置组件', ESYS_ToastMessageType.ERROR, 5);
        return;
    }


    const error = validateInputs.value;
    if (error) {
        console.error('验证错误:', error);
        if (isEDA) eda.sys_Message.showToastMessage(error, ESYS_ToastMessageType.ERROR, 5);
        return;
    }

    // 对 I2C 命名前缀进行字符白名单校验（若填写）
    if (selectedPlacementType.value === 'i2c' && i2cNamePrefix.value) {
        const prefixValid = /^[A-Za-z0-9*\/+\-!@#%^&_{}\[\]:;'",.<>\\|]*$/;
        if (!prefixValid.test(i2cNamePrefix.value)) {
            if (isEDA) eda.sys_Message.showToastMessage('命名前缀包含不允许的字符；仅允许字母、数字和部分特殊符号', ESYS_ToastMessageType.ERROR, 5);
            console.error('命名前缀包含不允许的字符；仅允许字母、数字和部分特殊符号');
            return;
        }
    }

    if (!isEDA) return;

    await eda.sys_IFrame.closeIFrame('OneClickPlace');
    eda.sys_Message.showToastMessage('请在原理图上左键点击选择放置位置，右键取消放置', ESYS_ToastMessageType.INFO, 5);
    eda.sch_Event.addMouseEventListener("OneClickPlace", 'all', async (eventType: ESCH_MouseEventType) => {
        console.log("mouse event", eventType);
        if (eventType === ESCH_MouseEventType.SELECTED) {
            loading.value = true;
            const libraryUuid = await eda.lib_LibrariesList.getSystemLibraryUuid();
            const position = await eda.sch_SelectControl.getCurrentMousePosition();
            if (libraryUuid && position) {
                switch (selectedPlacementType.value) {
                    case 'typec': {
                        await typec(libraryUuid, position);
                        break;
                    }
                    case 'led': {
                        await led(libraryUuid, position);
                        break;
                    }
                    case 'i2c': {
                        await i2c(libraryUuid, position);
                        break;
                    }
                }
            } else {
                console.error('无法获取系统库 UUID，放置失败');
            }

            loading.value = false;
        } else if (eventType === ESCH_MouseEventType.CLEAR_SELECTED) {
            eda.sys_Message.showToastMessage('放置已取消', ESYS_ToastMessageType.INFO, 3);
        }
    }, true);


};

/**
 * 重置所有参数
 */
const handleReset = () => {
    // reset only type-specific defaults
    needCCRes.value = true;
    ccResPackage.value = '0603';
    ledColor.value = 'red';
    ledResPosition.value = 0;
    ledResPackage.value = '0603';
    ledResValue.value = '4.7k';
    i2cResValue.value = '4.7k';
    i2cResPackage.value = '0603';
    i2cNamePrefix.value = '';
    i2cPullVoltage.value = '3.3V';
};

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

onMounted(() => {
    eda.sch_Event.removeEventListener("OneClickPlace");
});
</script>

<style scoped lang="scss">
@use '../styles/calculator-mixins.scss' as *;

// Container
.placement-container {
    @include calculator-base;
    padding: 12px;
    box-shadow: var(--calc-shadow);
    width: 360px;
    height: 360px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    & *,
    & *::before,
    & *::after {
        box-sizing: inherit;
    }

    .calc-header {
        @include calc-header;
        margin-bottom: 8px;
        flex: 0 0 auto;
    }
}

// Layout
.placement-layout {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;
}

// Selector
.placement-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background: var(--calc-card);
    border: 1px solid var(--calc-card-border);
    border-radius: 8px;
    min-width: 0;
}

.selector-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--calc-text);
    text-align: center;
}

.selector-tabs {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.selector-tab {
    padding: 8px 10px;
    border: 1px solid var(--calc-border);
    background: transparent;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--calc-text);
    cursor: pointer;
    transition: all 140ms ease;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.selector-tab:hover {
    background: var(--calc-row-hover);
    border-color: var(--calc-primary);
    color: var(--calc-primary);
}

.selector-tab.active {
    background: var(--calc-primary);
    color: white;
    border-color: var(--calc-primary);
    font-weight: 600;
}

.selector-tab:focus-visible {
    outline: none;
    box-shadow: var(--calc-focus-ring);
}

// Params
.placement-params {
    display: flex;
    flex-direction: column;
    padding: 10px;
    background: var(--calc-card);
    border: 1px solid var(--calc-card-border);
    border-radius: 8px;
    gap: 10px;
    min-width: 0;
    overflow: auto;
}

.params-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--calc-muted);
    font-size: 13px;
}

.placement-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
}

.form-body {
    flex: 1 1 auto;
    overflow: auto;
    padding-right: 6px;
}

.param-section {
    padding: 6px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--calc-text);
    padding: 4px 6px;
}

.section-desc {
    font-size: 12px;
    color: var(--calc-muted);
    padding: 0 6px 6px 6px;
}

.form-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-label {
    flex: 0 0 80px;
    min-width: 80px;
    font-size: var(--font-size-base);
    color: var(--calc-text);
    font-weight: 600;
    text-align: left;
}

.calc-segmented.compact {
    @include calc-segmented;
    width: 100%;
    padding: 2px;
}

.calc-segmented.compact button {
    flex: 1;
    padding: 4px 8px;
    font-size: 12px;
}

.calc-segmented.compact button.active {
    background: #fff;
    color: var(--calc-primary);
}

// Compact input with dark-mode rules
.calc-input.compact {
    @include calc-input;
    padding: 6px;
    font-size: 12px;
    height: 28px;
    flex: 1;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
}

.calc-input.compact[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
}

.calc-input.compact.short {
    max-width: 160px;
}

@media (prefers-color-scheme: dark) {
    .calc-input.compact {
        background: var(--calc-card) !important;
        color: var(--calc-text) !important;
        border-color: rgba(255, 255, 255, 0.06) !important;
    }

    .calc-input.compact::placeholder {
        color: var(--calc-muted) !important;
    }
}

// Actions
.form-actions {
    display: flex;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--calc-border);
    flex: 0 0 auto;
}

.btn-primary,
.btn-secondary {
    flex: 1;
    padding: 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 140ms ease;
}

.btn-primary {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border: none;
    outline: none;
    background: var(--calc-primary);
    color: white;
    box-shadow: var(--calc-btn-shadow);
    background-clip: padding-box;
}

.btn-primary:hover {
    filter: brightness(1.1);
}

.btn-primary:focus-visible {
    /* keep a subtle focus ring but avoid duplicating the main button shadow which can look like a border */
    box-shadow: var(--calc-focus-ring);
}

.btn-secondary {
    background: transparent;
    color: var(--calc-text);
    border: 1px solid var(--calc-border);
}

.btn-secondary:hover {
    background: var(--calc-row-hover);
    border-color: var(--calc-primary);
}

.btn-secondary:focus-visible {
    box-shadow: var(--calc-focus-ring);
}

@media (prefers-color-scheme: dark) {
    .selector-tab {
        border-color: rgba(255, 255, 255, 0.12);
    }

    .placement-params {
        border-color: var(--calc-card-border);
    }

    .btn-secondary {
        border-color: rgba(255, 255, 255, 0.12);
    }
}

@include hide-number-input-controls;
@include reduced-motion;
</style>
