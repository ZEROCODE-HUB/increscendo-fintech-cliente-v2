import { getAppSettings, type AppSettings } from '@/services/settingsService';

export const webMaintenanceLoader = (): Promise<AppSettings> => getAppSettings();

export const adminMaintenanceLoader = (): Promise<AppSettings> => getAppSettings();