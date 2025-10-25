import { EventItem, Column, BoardSettings } from '../types';

export interface BackupData {
    timestamp: string;
    events: EventItem[];
    columns: Column[];
    settings: BoardSettings;
}

export const saveWithBackup = (data: BackupData): void => {
    try {
        // Save current state
        localStorage.setItem('boardEvents', JSON.stringify(data.events));
        localStorage.setItem('boardColumns', JSON.stringify(data.columns));
        localStorage.setItem('boardSettings', JSON.stringify(data.settings));

        // Create backup
        const backups: BackupData[] = JSON.parse(localStorage.getItem('backups') || '[]');
        backups.unshift(data);
        if (backups.length > 5) backups.pop(); // Keep last 5 backups
        localStorage.setItem('backups', JSON.stringify(backups));
    } catch (error) {
        console.error('Failed to save backup:', error);
    }
};

export const loadFromBackup = (): BackupData | null => {
    try {
        const backups: BackupData[] = JSON.parse(localStorage.getItem('backups') || '[]');
        return backups.length > 0 ? backups[0] : null;
    } catch (error) {
        console.error('Failed to load from backup:', error);
        return null;
    }
};

export const createRecoveryPoint = (events: EventItem[], columns: Column[], settings: BoardSettings): void => {
    const recoveryPoint: BackupData = {
        timestamp: new Date().toISOString(),
        events,
        columns,
        settings
    };
    localStorage.setItem('lastRecoveryPoint', JSON.stringify(recoveryPoint));
};
