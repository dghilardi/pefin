import { atom } from "jotai";
import { GoogleClient } from "../client/google";

export type GoogleSession = {
    accessToken: string,
};

export const googleSessionAtom = atom<GoogleSession | undefined>();
export const googleClientAtom = atom<GoogleClient | undefined>((get) => {
    const session = get(googleSessionAtom);
    if (session) {
        return new GoogleClient(session);
    }
});