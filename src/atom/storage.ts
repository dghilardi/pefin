import { atom } from "jotai";
import { RemoteStorageInitializer, RemoteStorageService, RemoteStorageState } from "../service/remotestorage";
import { googleClientAtom } from "./googlesession";

export const storageStateAtom = atom<RemoteStorageState | undefined>();
export const storageServiceAtom = atom<RemoteStorageInitializer | RemoteStorageService | undefined>(get => {
    const client = get(googleClientAtom);
    const state = get(storageStateAtom);
    if (client && state) {
        return new RemoteStorageService(client, state);
    } else if (client) {
        return new RemoteStorageInitializer(client);
    }
});