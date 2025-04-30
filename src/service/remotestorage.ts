import dayjs, { Dayjs } from "dayjs";
import { GoogleClient, SpreadsheetAppendParams } from "../client/google";
import { AppConfig, defaultAppConfiguration, TransactionCategory } from "../core/config";
import { stringify as tomlSerialize, parse as tomlDeserialize } from 'smol-toml';
export class RemoteStorageInitializer {
    public readonly kind = 'remote-storage-initializer';
    public constructor(
        private client: GoogleClient
    ) { }

    public async initialize(): Promise<[RemoteStorageState, AppConfig]> {
        const listFilesRes = await this.client.listFiles({
            orderBy: [{ f: 'createdTime', o: 'desc' }],
            query: {
                mimeType: 'application/vnd.google-apps.folder',
                appProperties: { dirType: 'pefin.root' },
            }
        });
        let rootFolderId;
        if (listFilesRes.files.length > 0) {
            rootFolderId = listFilesRes.files[0].id;
        } else {
            const dirResource = await this.client.createFile({
                name: 'pefin',
                mimeType: 'application/vnd.google-apps.folder',
                appProperties: {
                    dirType: 'pefin.root',
                }
            });
            rootFolderId = dirResource.id;
        }

        const confFiles = await this.client.listFiles({
            orderBy: [{ f: 'createdTime', o: 'desc' }],
            query: {
                parent: rootFolderId,
                mimeType: 'text/plain',
                appProperties: { fileType: 'pefin.config' }
            }
        })

        let config;
        if (confFiles.files.length > 0) {
            const configStr = await this.client.downloadTextFile(confFiles.files[0].id);
            config = tomlDeserialize(configStr) as AppConfig;
        } else {
            config = defaultAppConfiguration();
            const createdFile = await this.client.createFile({
                name: 'config.toml',
                parents: [rootFolderId],
                mimeType: 'text/plain',
                appProperties: { fileType: 'pefin.config' }
            });
            await this.client.uploadFileContent(createdFile.id, 'text/plain', tomlSerialize(config));
        }

        return [{
            rootFolderId,
            spreadsheets: {},
        }, config]
    }
}

export type RemoteStorageState = {
    rootFolderId: string,
    spreadsheets: Record<string, string>
}

export const MONTHS_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export type TransactionData = {
    date: Dayjs,
    notes: string,
    details: string,
    sourceAccount?: string,
    destAccount?: string,
    group?: string,
    category: string,
    currency: string,
    type: 'expense' | 'income' | 'transfer',
    amount: number,
};

export type BatchReadResult = {
    year: number,
    month: number,
    data: TransactionData[],
}

const TRANSACTION_PAGE_HEADERS = {
    DATE: 'Date',
    TYPE: 'Type',
    SOURCE_ACCOUNT: 'Source Account',
    DESTINATION_ACCOUNT: 'Destination Account',
    GROUP: 'Group',
    CATEGORY: 'Category',
    NOTES: 'Notes',
    DETAILS: 'Details',
    CURRENCY: 'Currency',
    AMOUNT: 'Amount',
    TRANSACTION_ID: 'Transaction id',
};

export class RemoteStorageService {
    public readonly kind = 'remote-storage-service';
    public constructor(
        private client: GoogleClient,
        private state: RemoteStorageState,
    ) { }

    private async findFilesByYears(years: string[]): Promise<Record<string, string>> {
        let result = {};
        for (const year of years) {
            if (this.state.spreadsheets[year]) {
                result = { ...result, [year]: this.state.spreadsheets[year] }
            } else {
                const listResult = await this.client.listFiles({
                    orderBy: [{ f: 'createdTime', o: 'desc' }],
                    query: {
                        parent: this.state.rootFolderId,
                        mimeType: 'application/vnd.google-apps.spreadsheet',
                        appProperties: { year, fileType: 'pefin.movements' }
                    }
                });
                if (listResult.files.length > 0) {
                    result = { ...result, [year]: listResult.files[0].id };
                } else {
                    const createdSpreadsheet = await this.client.spreadsheetCreate({
                        properties: { title: `Pefin ${year} report` },
                        sheets: MONTHS_NAMES.map((month, monthIdx) => ({
                            properties: { title: month, index: monthIdx },
                            data: [{
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.DATE } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.TYPE } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.SOURCE_ACCOUNT } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.DESTINATION_ACCOUNT } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.GROUP } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.CATEGORY } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.NOTES } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.DETAILS } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.CURRENCY } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.AMOUNT } },
                                            { userEnteredValue: { stringValue: TRANSACTION_PAGE_HEADERS.TRANSACTION_ID } },
                                        ]
                                    }
                                ]
                            }]
                        }))
                    });
                    const spreadSheetResource = await this.client.updateFile(createdSpreadsheet.spreadsheetId, {
                        name: `${year}.xls`,
                        mimeType: 'application/vnd.google-apps.spreadsheet',
                        appProperties: { year, fileType: 'pefin.movements' }
                    }, [this.state.rootFolderId]);
                    result = { ...result, [year]: spreadSheetResource.id };
                }
            }
        }
        if (Object.entries(result).some(([year, _]) => !this.state.spreadsheets[year])) {
            const stateSpreadsheets = this.state.spreadsheets;
            this.state.spreadsheets = { ...stateSpreadsheets, ...result };
        }
        return result;
    }

    public async insertMovement(date: Dayjs, category: TransactionCategory, notes: string, amount: number) {
        await this.batchImportTransactions([{
            date,
            notes,
            details: '',
            sourceAccount: '',
            destAccount: '',
            group: category.group,
            category: category.name,
            currency: 'EUR',
            type: category.type,
            amount,
        }]);
    }

    public async batchImportTransactions(transactions: TransactionData[]) {
        const years = [...new Set(transactions.map(t => `${t.date.year()}`))];
        const sheets = await this.findFilesByYears(years);
        for (const year of years) {
            const yearTransactions = transactions.filter(t => `${t.date.year()}` === year);
            const months = [...new Set(yearTransactions.map(t => t.date.month()))];
            for (const month of months) {
                const yearMonthTransactions = yearTransactions.filter(t => t.date.month() === month);
                const range = MONTHS_NAMES[month];
                const params: SpreadsheetAppendParams = { insertDataOption: 'INSERT_ROWS', valueInputOption: 'USER_ENTERED' };
                const body = { range, values: yearMonthTransactions.map(t => [
                    t.date.format('YYYY-MM-DD'), 
                    t.type,
                    t.sourceAccount || '',
                    t.destAccount || '',
                    t.group || '', 
                    t.category, 
                    t.notes, 
                    t.details,
                    t.currency,
                    t.amount,
                    `${t.date.diff(dayjs('1900-01-01'), 'days').toString(16).padStart(6, '0').toUpperCase()}-${Math.floor(t.amount*100).toString(16).padStart(6,'0').toUpperCase()}-0000`
                ]) };
                await this.client.spreadsheetAppend(sheets[year], range, params, body);
            }
        }
    }

    public async batchReadMonths(ranges: { year: number, month: number }[]): Promise<BatchReadResult[]> {
        const years = [...new Set(ranges.map(r => `${r.year}`))];
        const sheets = await this.findFilesByYears(years);
        let result: BatchReadResult[] = [];
        for (const year of years) {
            const sheet = sheets[year];
            const months = ranges.filter(r => `${r.year}` === year).map(r => MONTHS_NAMES[r.month]);
            const readRes = await this.client.spreadsheetBatchRead(sheet, {
                ranges: months,
                majorDimension: 'ROWS',
                valueRenderOption: 'UNFORMATTED_VALUE',
            });
            const parsed = readRes.valueRanges.map((entry): BatchReadResult => {
                const month = MONTHS_NAMES.findIndex(mname => mname === entry.range.split('!')[0]);
                return {
                    year: Number(year),
                    month,
                    data: entry.values
                    .filter(row => 
                        row.length >= 10 
                        && (typeof row[0] === 'string' || typeof row[0] === 'number')
                        && (['expense', 'income', 'transfer'].includes(row[1] as string))
                        && typeof row[2] === 'string'
                        && typeof row[3] === 'string'
                        && typeof row[4] === 'string'
                        && typeof row[5] === 'string'
                        && typeof row[6] === 'string'
                        && typeof row[7] === 'string'
                        && typeof row[8] === 'string'
                        && typeof row[9] === 'number'
                    )
                    .map((row): TransactionData => ({
                        date: typeof row[0] === 'string' ? dayjs(row[0], 'YYYY-MM-DD') 
                            : typeof row[0] === 'number' ? dayjs(new Date(1900, 0, 0)).add(Number(row['0']) - 1, 'day')
                            : dayjs(new Date(1900, 0, 0)),
                        type: row[1] as 'expense' | 'income' | 'transfer',
                        sourceAccount: row[2] as string | undefined || '',
                        destAccount: row[3] as string | undefined || '',
                        group: row[4] as string | undefined || '',
                        category: row[5] as string | undefined || '',
                        notes: row[6] as string | undefined || '',
                        details: row[7] as string | undefined || '',
                        currency: row[8] as string | undefined || '',
                        amount: row[9] as number | undefined || 0,
                    }))
                };
            });
            result = [...result, ...parsed];
        }
        return result;
    }
}