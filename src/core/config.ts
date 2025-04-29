export type TransactionCategory = {
    name: string,
    group: string,
    type: 'expense' | 'income',
    readonly: boolean,
};

export type TransactionRewrite = {
    query: {
        category?: string,
        notes?: string,
        details?: string,
        type?: string,
    },
    patch: {
        notes?: string,
        details?: string,
        sourceAccount?: string,
        destAccount?: string,
        group?: string,
        category?: string,
        type?: string,
    },
}

export type ImportConfig = {
    rewrites: TransactionRewrite[],
}

export type AppConfig = {
    experimentalFeatures: boolean,
    import: ImportConfig,
    categories: TransactionCategory[],
}

export const defaultAppConfiguration = (): AppConfig => ({
    experimentalFeatures: false,
    import: {
        rewrites: [],
    },
    categories: [
        { name: 'Home', group: 'Necessities', type: 'expense', readonly: false },
        { name: 'Shopping', group: 'Necessities', type: 'expense', readonly: false },
        { name: 'Health', group: 'Necessities', type: 'expense', readonly: false },
        { name: 'Transports', group: 'Necessities', type: 'expense', readonly: false },
        { name: 'Telephone', group: 'Necessities', type: 'expense', readonly: false },
        { name: 'Clothes', group: 'Necessities', type: 'expense', readonly: false },
        { name: 'Entertainment', group: 'Extra', type: 'expense', readonly: false },
        { name: 'Presents', group: 'Extra', type: 'expense', readonly: false },
        { name: 'Culture', group: 'Extra', type: 'expense', readonly: false },
        { name: 'Lunch out', group: 'Extra', type: 'expense', readonly: false },
        { name: 'Other', group: 'Extra', type: 'expense', readonly: false },
    ]
});