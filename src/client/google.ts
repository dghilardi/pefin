import { getDefaultStore } from "jotai";
import { GoogleSession, googleSessionAtom } from "../atom/googlesession";

type Jsonable =
    | string
    | number
    | boolean
    | null
    | undefined
    | readonly Jsonable[]
    | { readonly [key: string]: Jsonable }
    | { toJSON(): Jsonable };

export class BaseError extends Error {
    public readonly context?: Jsonable;
    public readonly cause?: Error;

    constructor(
        message: string,
        options: { cause?: Error; context?: Jsonable } = {},
    ) {
        const { cause, context } = options;

        super(message);
        this.name = this.constructor.name;
        this.cause = cause;

        this.context = context;
    }
}

export type ListFilesQuery = {
    parent?: string,
    mimeType?: string,
    appProperties?: Record<string, string>
}

export type ListFilesParams = {
    query?: ListFilesQuery,
    orderBy?: { f: 'createdTime' | 'modifiedTime' | 'name', o: 'asc' | 'desc' }[],
};

export type FileResource = {
    id: string,
    name: string,
    parents?: string[],
    mimeType?: string,
    appProperties?: Record<string, string>
};

export type CreateFileDto = Omit<FileResource, 'id'>
export type UpdateFileDto = Omit<FileResource, 'id' | 'name' | 'parents'> & { name?: string }

export type ListFilesRes = { files: FileResource[] };

export type ConditionalFormat = {
    ranges: {
        sheetId: number,
        startRowIndex: number,
        endRowIndex: number,
        startColumnIndex: number,
        endColumnIndex: number,
    }[],
    booleanRule?: {
        condition: {
            type: 'CUSTOM_FORMULA',
            values: { userEnteredValue: string }[],
        },
        format: {
            backgroundColor: {
                red: number,
                green: number,
                blue: number,
            },
            backgroundColorStyle: {
                rgbColor: {
                    red: number,
                    green: number,
                    blue: number,
                }
            }
        },
    },
    gradientRule?: {},
};

export type Spreadsheet = {
    spreadsheetId: string,
    properties: {
        title: string,
    },
    sheets: {
        properties: {
            index: number,
            title: string,
        },
        basicFilter?: {
            range: {
                startRowIndex: number,
                endRowIndex: number,
                startColumnIndex: number,
                endColumnIndex: number,
            },
        },
        conditionalFormats?: ConditionalFormat[],
        data: {
            startRow: number,
            startColumn: number,
            rowData: {
                values: {
                    userEnteredValue: { numberValue: number } | { stringValue: string } | { boolValue: boolean } | { formulaValue: string }
                }[]
            }[],
        }[],
    }[],
};
export type SpreadsheetCreateReq = Omit<Spreadsheet, 'spreadsheetId'>;
export type SpreadsheetCreateRes = Spreadsheet;

export type ValueRange = {
    range: string,
    majorDimension?: 'ROWS' | 'COLUMNS',
    values: Value[][],
};

export type Value =
    | string
    | number
    | boolean
    | null
    | readonly Value[]
    | { readonly [key: string]: Value };

export type SpreadsheetAppendParams = {
    valueInputOption: 'RAW' | 'USER_ENTERED',
    insertDataOption: 'OVERWRITE' | 'INSERT_ROWS',
    includeValuesInResponse?: boolean,
    responseValueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA',
    responseDateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING',
};

export type SpreadsheetAppendRes = {
    spreadsheetId: string,
    tableRange: string,
    updates: {
        spreadsheetId: string,
        updatedRange: string,
        updatedRows: number,
        updatedColumns: number,
        updatedCells: number,
        updatedData: ValueRange,
    }
};

export type SpreadsheetBatchReadParams = {
    ranges: string[],
    majorDimension: 'ROWS' | 'COLUMNS',
    valueRenderOption?: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' | 'FORMULA',
    dateTimeRenderOption?: 'SERIAL_NUMBER' | 'FORMATTED_STRING',
};

export type SpreadsheetBatchReadRes = {
    spreadsheetId: string,
    valueRanges: ValueRange[],
};

const jotaiStore = getDefaultStore();

export class GoogleClient {
    public constructor(
        private session: GoogleSession
    ) { }

    private httpInvokeRaw(
        input: URL | Request | string,
        init?: RequestInit,
    ) {
        const headers = {
            ...(init?.headers || {}),
            'Authorization': `Bearer ${this.session.accessToken}` 
        };
        const fetchInit = init ? { ...init, headers } : { headers };
        return fetch(input, fetchInit)
            .then(async (res) => {
                if (res.status === 401) {
                    jotaiStore.set(googleSessionAtom, undefined);
                } else if (res.status >= 400) {
                    const resBody = await res.text();
                    console.error(
                        `${input} :: bad response status code ${res.status} - ${resBody}`,
                    );
                    const context = resBody.startsWith("{") ? JSON.parse(resBody) : resBody;

                    throw new BaseError(
                        `bad response status code ${res.status} - ${resBody}`,
                        { context },
                    );
                }
                return res;
            })
    }

    private httpInvoke(
        input: URL | Request | string,
        init?: RequestInit,
    ) {
        return this.httpInvokeRaw(input, init)
            .then(async (res) => {
                return await res.json();
            });
    }

    private httpGet(
        url: string,
        headers?: Record<string, string>,
    ) {
        return this.httpInvoke(url, {
            method: "GET",
            headers
        });
    }

    private httpPost<REQ>(
        url: string,
        body: REQ,
        headers?: Record<string, string>,
    ) {
        return this.httpInvoke(url, {
            method: "POST",
            headers: {
                ...(headers || {}),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    private httpPatch<REQ>(
        url: string,
        body: REQ,
        headers?: Record<string, string>,
    ) {
        return this.httpInvoke(url, {
            method: "PATCH",
            headers: {
                ...(headers || {}),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    public async listFiles(params?: ListFilesParams): Promise<ListFilesRes> {
        const queryStr = params
            ? '?' + new URLSearchParams({
                q: !params.query ? '' : [
                    !params.query.mimeType ? undefined : `mimeType='${params.query.mimeType}'`,
                    !params.query.parent ? undefined : `'${params.query.parent}' in parents`,
                    !params.query.appProperties ? undefined : '(' + Object.entries(params.query.appProperties).map(([k, v]) => `appProperties has { key='${k}' and value='${v}' }`).join(' and ') + ')'
                ].filter(cl => cl).join(' and '),
                orderBy: !params.orderBy ? '' : params.orderBy.map(cl => `${cl.f} ${cl.o}`).join(',')
            })
            : '';

        return await this.httpGet('https://www.googleapis.com/drive/v3/files' + queryStr);
    }

    public async createFile(file: CreateFileDto): Promise<FileResource> {
        return await this.httpPost('https://www.googleapis.com/drive/v3/files', file);
    }

    public async updateFile(fileId: string, file: UpdateFileDto, addParents?: string[]): Promise<FileResource> {
        const queryStr = !addParents ? '' : '?' + new URLSearchParams({ addParents: addParents.join(',') });
        return await this.httpPatch(`https://www.googleapis.com/drive/v3/files/${fileId}${queryStr}`, file);
    }

    public async uploadFileContent(fileId: string, contentType: string, body: ReadableStream | XMLHttpRequestBodyInit): Promise<FileResource> {
        return await this.httpInvoke(`https://www.googleapis.com/upload/drive/v3/files/${fileId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": contentType,
            },
            body,
        });
    }

    public async downloadTextFile(fileId: string): Promise<string> {
        return this.httpInvokeRaw(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`).then(res => res.text());
    }

    /****************/
    /* SPREADSHEETS */
    /****************/

    public async spreadsheetCreate(spreadsheet: SpreadsheetCreateReq): Promise<SpreadsheetCreateRes> {
        return await this.httpPost('https://sheets.googleapis.com/v4/spreadsheets', spreadsheet);
    }

    public async spreadsheetAppend(spreadsheetId: string, range: string, params: SpreadsheetAppendParams, values: ValueRange): Promise<SpreadsheetAppendRes> {
        const serializedParams = Object.entries(params)
            .map(([key, value]) => [`${key}`, `${value}`]);
        return await this.httpPost(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?` + new URLSearchParams(serializedParams),
            values,
        );
    }

    public async spreadsheetBatchRead(spreadsheetId: string, params: SpreadsheetBatchReadParams): Promise<SpreadsheetBatchReadRes> {
        const serializedParams = Object.entries(params)
            .filter(([key, value]) => !!key && !!value)
            .flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : value.map(v => [key, v]));
        return await this.httpGet(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?` + new URLSearchParams(serializedParams))
    }
}