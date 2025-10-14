import type { HTMLAttributes, VNode } from "vue";

//AdvanceFilter
export interface AdvanceFilterProps {
    showTrigger: boolean,
    class?: HTMLAttributes["class"],
    modelValue: {
        difficulty?: FilterProps<number>[];
        musicCategories?: FilterProps<string>[];
        version?: FilterProps<string>[];
        mapCategories?: FilterProps<string>[];
        difficultyRange?: [number, number];
        dxScore?: FilterProps<RangeAble<number>>[];
        fullCombo?: FilterProps<string>[];
        fullSync?: FilterProps<string>[];
        Type?: FilterProps<string>[];
        showUnplayed?: boolean;
    };
}
export interface FilterProps<T> {
    vnode?: VNode,
    label: string,
    value: T
}
export interface RangeAble<T> {
    min: T,
    max: T
}
export type AdvanceFilterFilters = Required<AdvanceFilterProps['modelValue']>;
export type AdvanceFilterEmits = {
    (e: 'update:modelValue', value: AdvanceFilterProps['modelValue']): void;
};
//Order
export interface OrderBadge {
    label: string,
    value: string,
    status_index: number
}