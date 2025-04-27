import { Dayjs } from "dayjs";
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
                                            { userEnteredValue: { stringValue: 'Date' } },
                                            { userEnteredValue: { stringValue: 'Type' } },
                                            { userEnteredValue: { stringValue: 'Source Account' } },
                                            { userEnteredValue: { stringValue: 'Destination Account' } },
                                            { userEnteredValue: { stringValue: 'Group' } },
                                            { userEnteredValue: { stringValue: 'Category' } },
                                            { userEnteredValue: { stringValue: 'Notes' } },
                                            { userEnteredValue: { stringValue: 'Details' } },
                                            { userEnteredValue: { stringValue: 'Currency' } },
                                            { userEnteredValue: { stringValue: 'Amount' } },
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
        const year = `${date.year()}`;
        const month = MONTHS_NAMES[date.month()];
        const range = month;
        const sheets = await this.findFilesByYears([year]);
        const params: SpreadsheetAppendParams = { insertDataOption: 'INSERT_ROWS', valueInputOption: 'RAW' };
        const body = { range, values: [[date.format(), category.type, category.group, category.name, notes, amount]] };
        await this.client.spreadsheetAppend(sheets[year], range, params, body);
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
                    t.amount
                ]) };
                await this.client.spreadsheetAppend(sheets[year], range, params, body);
            }
        }
    }
}