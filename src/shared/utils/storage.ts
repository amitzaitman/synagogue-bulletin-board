const SELECTED_SYNAGOGUE_KEY = 'selectedSynagogue';

export function saveSelectedSynagogue(slug: string): void {
    try {
        localStorage.setItem(SELECTED_SYNAGOGUE_KEY, slug);
    } catch (error) {
        console.error('Error saving selected synagogue to localStorage:', error);
    }
}

export function getSelectedSynagogue(): string | null {
    try {
        return localStorage.getItem(SELECTED_SYNAGOGUE_KEY);
    } catch (error) {
        console.error('Error getting selected synagogue from localStorage:', error);
        return null;
    }
}
