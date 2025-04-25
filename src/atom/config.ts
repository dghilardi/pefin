import { atom } from "jotai";
import { defaultAppConfiguration } from "../core/config";

export const appConfigAtom = atom(defaultAppConfiguration());