import type { StorageProvider } from "../../types/storage.types.js";
import { awsS3Provider } from "./aws.s3.provider.js";

let activeProvider: StorageProvider = awsS3Provider;

export const getStorageProvider = (): StorageProvider => activeProvider;

export const setStorageProvider = (provider: StorageProvider): void => {
  activeProvider = provider;
};