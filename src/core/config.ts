export type TransactionCategory = {
    name: string,
    group: string,
    type: 'expense' | 'income',
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
        { name: 'Home', group: 'Necessities', type: 'expense' },
        { name: 'Shopping', group: 'Necessities', type: 'expense' },
        { name: 'Health', group: 'Necessities', type: 'expense' },
        { name: 'Transports', group: 'Necessities', type: 'expense' },
        { name: 'Telephone', group: 'Necessities', type: 'expense' },
        { name: 'Clothes', group: 'Necessities', type: 'expense' },
        { name: 'Entertainment', group: 'Extra', type: 'expense' },
        { name: 'Presents', group: 'Extra', type: 'expense' },
        { name: 'Culture', group: 'Extra', type: 'expense' },
        { name: 'Lunch out', group: 'Extra', type: 'expense' },
        { name: 'Other', group: 'Extra', type: 'expense' },
    ]
});