import type { StorageProvider } from "../../types/storage.types.js";
import { spaceByteProvider } from "./spacebyte.provider.js";

let activeProvider: StorageProvider = spaceByteProvider;

export const getStorageProvider = (): StorageProvider => activeProvider;

export const setStorageProvider = (provider: StorageProvider): void => {
  activeProvider = provider;
};