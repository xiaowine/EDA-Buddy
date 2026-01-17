<template>
    <div class="diffpair-calculator calculator-base">
        <header class="calc-header">
            <h3>差分对识别</h3>
        </header>

        <div class="columns">
            <div class="left">
                <div class="calc-form">
                    <div class="calc-field">
                        <label>状态</label>
                        <div>{{ loading ? '加载中...' : '已加载' }}</div>
                    </div>

                    <div class="calc-field">
                        <label>总网络数量</label>
                        <div>{{ totalNets }}</div>
                    </div>

                    <div class="calc-field">
                        <label>识别出的正常对</label>
                        <div>{{ normalPairs.length }}</div>
                    </div>

                    <div class="calc-field">
                        <label>识别出的重名对</label>
                        <div>{{ duplicatedPairs.length }}</div>
                    </div>

                    <div class="calc-field">
                        <label>已存在差分对</label>
                        <div>{{ existingPairs.length }}</div>
                    </div>

                    <div class="calc-result-card" style="margin-top:12px; padding:10px 12px;">
                        <div class="calc-result-inner">
                            <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:13px;">
                                <div><strong>正常:</strong> {{ normalPairs.length }}</div>
                                <div><strong>重名:</strong> {{ duplicatedPairs.length }}</div>
                                <div><strong>已存在:</strong> {{ existingPairs.length }}</div>
                            </div>
                        </div>
                    </div>

                    <div class="button-group">
                        <button class="refresh-btn" @click="refreshDiffPairs" :disabled="loading">
                            <span v-if="loading">识别中...</span>
                            <span v-else>🔄 重新识别</span>
                        </button>
                        <button class="apply-btn" @click="applyDiffPairs" :disabled="selectedCount === 0">
                            <span>✓ 应用</span>
                            <span v-if="selectedCount > 0">({{ selectedCount }})</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="right">
                <div class="calc-result" style="padding-left:0;">
                    <section style="margin-top:0;">
                        <h4>差分对 ({{ normalPairs.length }})</h4>
                        <table class="dp-table">
                            <thead>
                                <tr>
                                    <th style="width:36px">
                                        <input type="checkbox" :checked="isAllSelected(normalPairs)"
                                            @change="toggleSelectAll(normalPairs, $event)" />
                                    </th>
                                    <th>名称</th>
                                    <th>正极</th>
                                    <th>负极</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in normalPairs" :key="p.name">
                                    <td>
                                        <input type="checkbox" v-model="selectedMap[idOf(p)]" />
                                    </td>
                                    <td>{{ p.name }}</td>
                                    <td>{{ p.positiveNet }}</td>
                                    <td>{{ p.negativeNet }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section style="margin-top:12px;">
                        <h4>重名差分对 ({{ duplicatedPairs.length }})</h4>
                        <table class="dp-table dp-table-dup">
                            <thead>
                                <tr>
                                    <th style="width:36px">
                                        <input type="checkbox" :checked="isAllSelected(duplicatedPairs)"
                                            @change="toggleSelectAll(duplicatedPairs, $event)" />
                                    </th>
                                    <th>名称</th>
                                    <th>正极</th>
                                    <th>负极</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in duplicatedPairs" :key="p.name + '_dup'">
                                    <td>
                                        <input type="checkbox" v-model="selectedMap[idOf(p)]" />
                                    </td>
                                    <td>{{ p.name }}</td>
                                    <td>{{ p.positiveNet }}</td>
                                    <td>{{ p.negativeNet }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section style="margin-top:12px;">
                        <h4>已存在差分对 ({{ existingPairs.length }})</h4>
                        <table class="dp-table dp-table-exist">
                            <thead>
                                <tr>
                                    <th style="width:36px">操作</th>
                                    <th>名称</th>
                                    <th>正极</th>
                                    <th>负极</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in existingPairs" :key="p.name + '_ex'">
                                    <td>
                                        <button class="delete-btn" @click="deleteExisting(p)">删除</button>
                                    </td>
                                    <td>{{ p.name }}</td>
                                    <td>{{ p.positiveNet }}</td>
                                    <td>{{ p.negativeNet }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>
                <div class="dup-note">说明：重名差分对表示名称与已有差分对或识别出的其他差分对冲突，但是网络不冲突，系统会在后面添加*号必然，建议检查或重命名后再应用。</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { identifyNewDiffPairs, test } from '../utils/diffpair';
import { isEDA } from '../utils/utils';

const loading = ref(true);
type IPCB_DifferentialPairItem = { name: string; positiveNet: string; negativeNet: string };

const duplicatedPairs = ref<IPCB_DifferentialPairItem[]>([]);
const normalPairs = ref<IPCB_DifferentialPairItem[]>([]);
const existingPairs = ref<IPCB_DifferentialPairItem[]>([]);
const totalNets = ref(0);
const selectedMap = reactive<Record<string, boolean>>({});

const idOf = (p: IPCB_DifferentialPairItem) => `${p.positiveNet}||${p.negativeNet}`;

const selectedCount = computed(() => {
    const all = [...normalPairs.value, ...duplicatedPairs.value];
    return all.filter((p) => !!selectedMap[idOf(p)]).length;
});

const isAllSelected = (list: IPCB_DifferentialPairItem[]) => {
    if (!list || list.length === 0) return false;
    return list.every((p) => !!selectedMap[idOf(p)]);
};

const toggleSelectAll = (list: IPCB_DifferentialPairItem[], checkedOrEvent: boolean | Event) => {
    const checked = typeof checkedOrEvent === 'boolean'
        ? checkedOrEvent
        : ((checkedOrEvent?.target as HTMLInputElement | null)?.checked ?? false);
    list.forEach((p) => {
        selectedMap[idOf(p)] = checked;
    });
};

watch(loading, (newVal) => {
    if (isEDA) {
        if (newVal) {
            eda.sys_LoadingAndProgressBar.showLoading();
        } else {
            eda.sys_LoadingAndProgressBar.destroyLoading();
        }
    }
}, { flush: 'sync' });

onMounted(async () => {
    refreshDiffPairs();
});

const applyDiffPairs = async () => {
    console.log('应用差分对:', normalPairs.value);
    if (!isEDA) return;
    const allCandidates = [...normalPairs.value, ...duplicatedPairs.value];
    const selected = allCandidates.filter((p) => selectedMap[idOf(p)]);
    if (selected.length === 0) {
        eda.sys_Message.showToastMessage('未选择任何差分对，请先勾选要应用的项', ESYS_ToastMessageType.WARNING, 3000)
        return;
    }
    loading.value = true;
    try {
        for (const pair of selected) {
            try {
                const succ = await eda.pcb_Drc.createDifferentialPair(pair.name, pair.positiveNet, pair.negativeNet);
                if (succ) {
                    console.log(`创建差分对 ${pair.name} 成功`);
                } else {
                    eda.sys_Message.showToastMessage(`创建差分对 ${pair.name} 失败`, ESYS_ToastMessageType.ERROR, 3000);
                    console.log(`创建差分对 ${pair.name} 失败`);
                }
            } catch (e) {
                eda.sys_Message.showToastMessage(`创建差分对 ${pair.name} 失败`, ESYS_ToastMessageType.ERROR, 3000);
                console.log(`创建差分对 ${pair.name} 失败:`, e);
            }
        }
        eda.sys_Message.showToastMessage('差分对已应用完成！', ESYS_ToastMessageType.SUCCESS, 3000)
    } finally {
        loading.value = false;
    }
    await refreshDiffPairs();
};

const refreshDiffPairs = async () => {
    loading.value = true;
    try {
        console.log('开始识别差分对...');
        let nowNets: string[] = test;
        let nowDiffPairsRaw: IPCB_DifferentialPairItem[] = [];
        if (isEDA) {
            nowNets = await eda.pcb_Net.getAllNetsName();
            nowDiffPairsRaw = await eda.pcb_Drc.getAllDifferentialPairs();
        }
        console.log(typeof nowNets, nowNets);
        console.log('获取网络数量:', nowNets.length);
        console.log('获取现有差分对:', nowDiffPairsRaw);
        totalNets.value = nowNets.length;
        const existingSimple = (nowDiffPairsRaw || []);
        const res = identifyNewDiffPairs(nowNets, existingSimple as any);
        console.log('识别结果 - 正常对:', res.normalPairs?.length, '重名对:', res.duplicatedPairs?.length);
        duplicatedPairs.value = (res.duplicatedPairs || []);
        normalPairs.value = (res.normalPairs || []);
        existingPairs.value = (res.existingPairs || existingSimple || []);

        const currentIds = new Set([...normalPairs.value, ...duplicatedPairs.value].map(idOf));
        Object.keys(selectedMap).forEach((k) => {
            if (!currentIds.has(k)) delete selectedMap[k];
        });
        console.log('差分对识别完成');
    } catch (e: any) {
        console.log('识别差分对时出错:', e);
    } finally {
        loading.value = false;
    }
};

const deleteExisting = async (pair: IPCB_DifferentialPairItem) => {
    if (!isEDA) {
        existingPairs.value = existingPairs.value.filter((p) => idOf(p) !== idOf(pair));
        return;
    }
    loading.value = true;
    try {
        const succ = await eda.pcb_Drc.deleteDifferentialPair(pair.name);
        if (!succ) {
            eda.sys_Message.showToastMessage(`删除差分对 ${pair.name} 失败`, ESYS_ToastMessageType.ERROR, 3000);
            console.log(`删除差分对 ${pair.name} 失败`);
        }
    } catch (e: any) {
        eda.sys_Message.showToastMessage(`删除差分对 ${pair.name} 失败`, ESYS_ToastMessageType.ERROR, 3000);
        console.log('删除差分对出错:', e);
    } finally {
        loading.value = false;
    }
    eda.sys_Message.showToastMessage(`删除差分对 ${pair.name} 成功`, ESYS_ToastMessageType.SUCCESS, 3000);
    await refreshDiffPairs();
};

</script>

<style scoped lang="scss">
@use '../styles/calculator-mixins.scss' as *;

.diffpair-calculator {
    @include calculator-base;
    padding: 16px;
    box-shadow: var(--calc-shadow);
    max-width: 700px;
    width: 100%;
    color: var(--calc-text);

    .calc-header {
        @include calc-header;
        margin-bottom: 8px;
    }

    .calc-form {
        @include calc-form;
        gap: 8px;
    }

    .calc-field {
        @include calc-field;

        label {
            width: 120px;
        }
    }

    .calc-result {
        @include calc-result;
    }

    .calc-result-card {
        @include calc-result-card;
        padding: 10px 12px;

        .calc-result-inner {
            min-height: auto;
        }

        strong {
            color: var(--calc-muted);
            font-weight: 500;
            font-size: 11px;
        }
    }

    h4 {
        margin: 8px 0 6px 0;
        font-size: 14px;
        color: var(--calc-text);
    }

    .dp-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        font-size: 12px;
        table-layout: fixed;
    }

    .dp-table th:nth-child(1),
    .dp-table td:nth-child(1) {
        width: 36px;
        min-width: 36px;
        max-width: 36px;
        text-align: center;
    }

    .dp-table td:nth-child(1) {
        overflow: visible;
    }

    .dp-table th:nth-child(2),
    .dp-table td:nth-child(2) {
        width: 30%;
    }

    .dp-table th:nth-child(3),
    .dp-table td:nth-child(3),
    .dp-table th:nth-child(4),
    .dp-table td:nth-child(4) {
        width: 35%;
    }


    .dp-table th input[type="checkbox"],
    .dp-table td input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0;
        display: inline-block;
        vertical-align: middle;
        box-sizing: border-box;
    }

    .dp-table th,
    .dp-table td {
        border: 1px solid var(--calc-border);
        padding: 6px 8px;
        text-align: left;
        max-width: 0;
        position: relative;
    }

    .dp-table td {
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;

        &::-webkit-scrollbar {
            height: 4px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--calc-border);
            border-radius: 2px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: var(--calc-muted);
        }
    }

    .dp-table th {
        font-weight: 600;
        background: var(--calc-table-header);
        color: var(--calc-text);
    }

    .dp-table tbody tr:nth-child(odd) {
        background: var(--calc-table-row-odd);
        color: var(--calc-text);
    }

    .dp-table tbody tr:hover {
        background: var(--calc-row-hover);
        color: var(--calc-text);
    }

    .dp-table-dup td {
        color: var(--calc-error);
    }

    .dp-table-exist td {
        color: var(--calc-muted);
    }

    .columns {
        display: flex;
        gap: 16px;
        height: 320px;
    }

    .left {
        width: 240px;
        flex: 0 0 240px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        background: var(--calc-card);
        border-radius: 8px;
        padding: 12px;
    }

    .left .calc-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
    }

    .left .calc-field {
        font-size: 12px;
        padding: 4px 0;
    }

    .left label {
        width: 100px;
        font-size: 12px;
        color: var(--calc-muted);
        font-weight: 500;
    }

    .left .calc-field>div {
        font-weight: 600;
        color: var(--calc-text);
    }

    .right {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        min-width: 0;
        /* 防止表格撑开容器 */
    }

    /* 覆盖 calc-result mixin 的设置 */
    .right .calc-result {
        margin-top: 0;
        height: auto;
    }

    .button-group {
        margin-top: auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--calc-border);
    }

    .refresh-btn,
    .apply-btn {
        padding: 10px 12px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        &:hover:not(:disabled) {
            transform: translateY(-1px);
        }

        &:active:not(:disabled) {
            transform: translateY(0);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        &:focus-visible {
            outline: none;
            box-shadow: var(--calc-focus-ring);
        }
    }

    .refresh-btn {
        background: var(--calc-card);
        color: var(--calc-text);
        border: 1px solid var(--calc-border);

        &:hover:not(:disabled) {
            background: var(--calc-refresh-hover-bg);
            border-color: var(--calc-primary);
        }
    }

    .apply-btn {
        background: var(--calc-primary);
        color: white;

        &:hover:not(:disabled) {
            background: #3b82f6;
            box-shadow: var(--calc-btn-shadow);
        }

        &:disabled {
            background: var(--calc-muted);
        }
    }

    .dup-note {
        margin-top: 12px;
        font-size: 12px;
        color: var(--calc-muted);
        padding: 8px 12px 0 0;
    }

    .delete-btn {
        background: transparent;
        border: 1px solid var(--calc-border);
        color: var(--calc-text);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
    }

    .delete-btn:hover {
        background: var(--calc-delete-hover-bg);
        border-color: var(--calc-delete-hover-border);
        color: var(--calc-error);
    }

    @media (prefers-color-scheme: dark) {
        .delete-btn {
            border-color: var(--calc-card-border);
            color: var(--calc-text);
            background: transparent;
        }

        .delete-btn:hover {
            background: var(--calc-delete-hover-bg);
            border-color: var(--calc-delete-hover-border);
            color: var(--calc-error);
        }
    }
}
</style>
