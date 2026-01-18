<template>
	<section class="dp-section">
		<h4>{{ title }}</h4>
		<table class="dp-table" :class="tableClass">
			<thead>
				<tr>
					<th v-for="col in displayColumns" :key="col.key" :style="{ width: col.width }">
						<template v-if="col.key === '__first__' && selectable">
							<input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
						</template>
						<template v-else>
							{{ col.label }}
						</template>
					</th>
				</tr>
			</thead>
			<tbody v-if="data.length > 0">
				<tr v-for="item in data" :key="getRowKey(item)">
					<td v-for="col in displayColumns" :key="col.key" :style="{ width: col.width }">
						<!-- 复选框列 -->
						<template v-if="col.key === '__first__' && selectable">
							<input
								type="checkbox"
								:checked="isChecked(item)"
								@change="(e) => onCheckChange(item, (e.target as HTMLInputElement).checked)"
							/>
						</template>
						<!-- 操作列 -->
						<template v-else-if="col.key === '__first__' && actions">
							<button
								v-for="action in actions"
								:key="action.key"
								class="action-btn"
								:class="action.class"
								:disabled="getActionDisabled(item, action)"
								@click="() => onActionClick(item, action)"
							>
								<span v-if="getActionLoading(item, action)">{{ action.loadingText }}</span>
								<span v-else>{{ action.text }}</span>
							</button>
						</template>
						<!-- 数据列 -->
						<template v-else>
							<slot :name="`cell-${col.key}`" :item="item" :value="item[col.key as keyof typeof item]">
								{{ item[col.key as keyof typeof item] }}
							</slot>
						</template>
					</td>
				</tr>
			</tbody>
			<tbody v-else>
				<tr>
					<td :colspan="displayColumns.length" class="dp-empty">
						<slot name="empty">未发现匹配的数据</slot>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';

export interface TableColumn {
	key: string;
	label: string;
	width?: string;
}

export interface TableAction {
	key: string;
	text: string;
	loadingText?: string;
	class?: string;
}

interface Props {
	title: string;
	data: T[];
	columns: TableColumn[];
	rowKeyField?: string;
	tableClass?: string;
	// 复选框相关
	selectable?: boolean;
	selectedMap?: Record<string, boolean>;
	// 操作按钮相关
	actions?: TableAction[];
	loadingMap?: Record<string, boolean>;
	disabledMap?: Record<string, boolean>;
}

interface Emits {
	(e: 'update:selectedMap', value: Record<string, boolean>): void;
	(e: 'check-change', item: T, checked: boolean): void;
	(e: 'action', item: T, action: TableAction): void;
}

const props = withDefaults(defineProps<Props>(), {
	rowKeyField: 'name',
	selectable: false,
	actions: undefined,
	loadingMap: () => ({}),
	disabledMap: () => ({}),
});

const emit = defineEmits<Emits>();

const getRowKey = (item: T): string => {
	// 对于被动器件差分对（有 matchReason 字段），使用特殊的 key 生成方式
	if ('matchReason' in item && item.matchReason === 'unpaired') {
		return `passive_${(item as any).differentialPairName}`;
	}
	// 对于差分对对象（有 positiveNet 和 negativeNet），使用特殊的 key 生成方式
	if ('positiveNet' in item && 'negativeNet' in item) {
		return `${item.positiveNet}||${item.negativeNet}`;
	}
	// 否则使用 rowKeyField
	if (props.rowKeyField in item) {
		return String(item[props.rowKeyField as keyof T]);
	}
	return JSON.stringify(item);
};

// 动态生成列配置（在开头添加复选框或操作列）
const displayColumns = computed(() => {
	// 过滤掉特殊列标记（只保留真实数据列）
	const dataColumns = props.columns.filter((col) => !col.key.startsWith('__'));

	const hasFirstCol = props.selectable || props.actions;
	if (!hasFirstCol) return dataColumns;

	const firstCol: TableColumn = {
		key: '__first__',
		label: props.actions ? '操作' : '',
		width: '45px',
	};
	return [firstCol, ...dataColumns];
});

// ============ 复选框相关逻辑 ============
const isChecked = (item: T): boolean => {
	const key = getRowKey(item);
	return !!(props.selectedMap && props.selectedMap[key]);
};

const isAllSelected = computed(() => {
	if (!props.selectable || props.data.length === 0) return false;
	return props.data.every((item) => isChecked(item));
});

const onCheckChange = (item: T, checked: boolean) => {
	const key = getRowKey(item);
	const newMap = { ...(props.selectedMap || {}) };
	newMap[key] = checked;
	emit('update:selectedMap', newMap);
	emit('check-change', item, checked);
};

const toggleSelectAll = (event: Event) => {
	const checked = (event.target as HTMLInputElement).checked;
	const newMap = { ...(props.selectedMap || {}) };
	props.data.forEach((item) => {
		newMap[getRowKey(item)] = checked;
	});
	emit('update:selectedMap', newMap);
};

// ============ 操作按钮相关逻辑 ============
const getActionRowKey = (item: T, action: TableAction): string => {
	return `${getRowKey(item)}|${action.key}`;
};

const getActionLoading = (item: T, action: TableAction): boolean => {
	const key = getActionRowKey(item, action);
	return !!props.loadingMap?.[key];
};

const getActionDisabled = (item: T, action: TableAction): boolean => {
	const key = getActionRowKey(item, action);
	return !!props.disabledMap?.[key] || getActionLoading(item, action);
};

const onActionClick = (item: T, action: TableAction) => {
	emit('action', item, action);
};
</script>

<style scoped lang="scss">
.dp-section {
	margin-top: 12px;

	h4 {
		margin: 8px 0 6px 0;
		font-size: 14px;
		color: var(--calc-text);
	}
}

.dp-table {
	width: 100%;
	border-collapse: collapse;
	margin-top: 8px;
	font-size: 12px;
	table-layout: fixed;

	th,
	td {
		border: 1px solid var(--calc-border);
		padding: 6px 8px;
		text-align: left;
		position: relative;
	}

	// 第一列（复选框或操作列）特殊处理
	th:first-child,
	td:first-child {
		text-align: center;
		padding: 6px 4px;
		max-width: none;
		overflow: visible;
	}

	// 数据列处理
	th:not(:first-child),
	td:not(:first-child) {
		max-width: 0;
		overflow-x: auto;
		overflow-y: hidden;
		white-space: nowrap;
	}

	td:not(:first-child) {
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

	th {
		font-weight: 600;
		background: var(--calc-table-header);
		color: var(--calc-text);
	}

	tbody tr:nth-child(odd) {
		background: var(--calc-table-row-odd);
		color: var(--calc-text);
	}

	tbody tr:hover {
		background: var(--calc-row-hover);
		color: var(--calc-text);
	}

	input[type='checkbox'] {
		width: 16px;
		height: 16px;
		margin: 0;
		display: inline-block;
		vertical-align: middle;
		box-sizing: border-box;
	}
}

.action-btn {
	padding: 4px 6px;
	font-size: 12px;
	border-radius: 4px;
	border: 1px solid var(--calc-border);
	background: var(--calc-card);
	color: var(--calc-text);
	cursor: pointer;
	transition: all 0.2s ease;
	margin: 0 2px;
	white-space: nowrap;
	display: inline-block;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	&.delete-btn {
		border-color: var(--calc-border);
		color: var(--calc-text);

		&:hover:not(:disabled) {
			background: var(--calc-delete-hover-bg);
			border-color: var(--calc-delete-hover-border);
			color: var(--calc-error);
		}

		@media (prefers-color-scheme: dark) {
			border-color: var(--calc-card-border);
		}
	}
}

.dp-empty {
	color: var(--calc-muted) !important;
	text-align: center !important;
	padding: 12px 8px !important;
}
</style>
