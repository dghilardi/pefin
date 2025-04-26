import { Dayjs } from "dayjs";
import { GoogleClient } from "../client/google";
import { AppConfig, defaultAppConfiguration, TransactionCategory } from "../core/config";
import { stringify as tomlSerialize, parse as tomlDeserialize } from 'smol-toml';
export class RemoteStorageInitializer {
    public readonly kind = 'remote-storage-initializer';
    public constructor(
        private client: GoogleClient
    ) {}

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

export class RemoteStorageService {
    public readonly kind = 'remote-storage-service';
    public constructor(
        private client: GoogleClient,
        private state: RemoteStorageState,
    ) {}

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
                    const spreadSheetResource = await this.client.createFile({
                        name: `${year}.xls`,
                        parents: [this.state.rootFolderId],
                        mimeType: 'application/vnd.google-apps.spreadsheet',
                        appProperties: { year, fileType: 'pefin.movements' }
                    });
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
        const sheets = await this.findFilesByYears([`${date.year()}`]);
        console.log(`${sheets} -> row ${date};${category};${notes};${amount}`);
    }
}