import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { GoogleClient } from "../client/google";

export type GoogleSession = {
    accessToken: string,
};

export const googleSessionAtom = atomWithStorage<GoogleSession | undefined>('google-session', undefined);
export const googleClientAtom = atom<GoogleClient | undefined>((get) => {
    const session = get(googleSessionAtom);
    if (session) {
        return new GoogleClient(session);
    }
});