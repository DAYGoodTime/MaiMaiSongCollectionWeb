
//AdvanceFilter
export interface AdvanceFilterProps {
    modelValue: {
        difficulty?: FilterProps<number>[];
        musicCategories?: FilterProps<string>[];
        version?: FilterProps<string>[];
        mapCategories?: FilterProps<string>[];
        difficultyRange?: [number, number];
        fullCombo?: FilterProps<string>[];
        fullSync?: FilterProps<string>[];
        Type?: FilterProps<string>[];
        showUnplayed?: boolean;
    };
}
export interface FilterProps<T> {
    label: string,
    value: T
}
export type AdvanceFilterFilters = Required<AdvanceFilterProps['modelValue']>;
export type AdvanceFilterEmits = {
    (e: 'update:modelValue', value: AdvanceFilterProps['modelValue']): void;
};