import { atomWithStorage } from "jotai/utils";
import { AppConfig, defaultAppConfiguration } from "../core/config";

export type ConfigFileData = {
    lastModified: string,
    fileId: string,
}

export type ConfigData = {
    file?: ConfigFileData,
    conf: AppConfig,
};

export const appConfigAtom = atomWithStorage<ConfigData>('app-config', { conf: defaultAppConfiguration() }, undefined, { getOnInit: true });