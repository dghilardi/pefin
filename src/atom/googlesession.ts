import { atom } from "jotai";

export type GoogleSession = {
    accessToken: string,
};

export const googleSessionAtom = atom<GoogleSession | undefined>();