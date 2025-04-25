import { GoogleSession } from "../atom/googlesession";

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

export type FileResource = {
    id: string,
    name: string,
    parents?: string[],
    mimeType?: string,
    appProperties?: Record<string, string>
};

export type CreateFileDto = Omit<FileResource, 'id'>

export type ListFilesRes = { files: FileResource[]};

export class GoogleClient {
    public constructor(
        private session: GoogleSession
    ) { }

    private httpInvoke(
        input: URL | Request | string,
        init?: RequestInit,
    ) {
        return fetch(input, init)
            .then(async (res) => {
                if (res.status >= 400) {
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
                return await res.json();
            });
    }

    private httpGet(
        url: string,
        headers?: Record<string, string>,
    ) {
        return this.httpInvoke(url, {
            method: "GET",
            headers: {
                ...(headers || {}),
                "Authorization": `Bearer ${this.session.accessToken}`,
            },
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
                "Authorization": `Bearer ${this.session.accessToken}`,
            },
            body: JSON.stringify(body),
        });
    }

    public async listFiles(): Promise<ListFilesRes> {
        return await this.httpGet('https://www.googleapis.com/drive/v3/files')
    }

    public async createFile(file: CreateFileDto): Promise<FileResource> {
        return await this.httpPost('https://www.googleapis.com/drive/v3/files', file);
    }
}