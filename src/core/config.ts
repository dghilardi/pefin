export type TransactionCategory = {
    name: string,
    group: string,
    type: 'expense' | 'income',
};

export type AppConfig = {
    categories: TransactionCategory[],
}

export const defaultAppConfiguration = (): AppConfig => ({
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