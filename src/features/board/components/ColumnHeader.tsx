import React from 'react';
import { Column, BoardSettings } from '../../../shared/types/types';

// --- Helper Icons ---
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface ColumnHeaderProps {
    column: Column;
    settings: BoardSettings;
    isEditMode: boolean;
    editingColumn?: { id: string, title: string, columnType: string, specificDate?: string } | null;
    onEditColumnTitleChange?: (title: string) => void;
    onEditColumnTypeChange?: (columnType: 'shabbat' | 'weekdays' | 'moed') => void;
    onEditSpecificDateChange?: (date: string) => void;
    onSaveColumnTitle?: () => void;
    onSetEditingColumn?: () => void;
    onDeleteColumn?: (id: string) => void;
    onColumnDragStart?: (e: React.DragEvent, columnId: string) => void;
    onColumnDragEnd?: () => void;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
    column,
    settings,
    isEditMode,
    editingColumn,
    onEditColumnTitleChange,
    onEditColumnTypeChange,
    onEditSpecificDateChange,
    onSaveColumnTitle,
    onSetEditingColumn,
    onDeleteColumn,
    onColumnDragStart,
    onColumnDragEnd
}) => {
    const titleFontSize = `${2.8 * (settings.columnTitleSize / 100)}em`;

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSaveColumnTitle?.();
        } else if (e.key === 'Escape') {
            onSetEditingColumn?.();
        }
    };

    const getColumnTypeLabel = (type: string) => {
        switch (type) {
            case 'shabbat': return 'שבת';
            case 'weekdays': return 'ימות השבוע';
            case 'moed': return 'מועד';
            default: return type;
        }
    };

    return (
        <header
            className={`text-center flex flex-col items-center justify-center gap-2`}
            style={{ paddingTop: '0.25em', paddingBottom: '0.25em' }}
            draggable={isEditMode && !!onColumnDragStart && !editingColumn}
            onDragStart={isEditMode && onColumnDragStart && !editingColumn ? (e) => onColumnDragStart(e, column.id) : undefined}
            onDragEnd={isEditMode && onColumnDragEnd ? onColumnDragEnd : undefined}
        >
            {isEditMode && editingColumn?.id === column.id ? (
                <div className="flex flex-col gap-2 w-full px-2">
                    <input
                        type="text"
                        value={editingColumn.title}
                        onChange={(e) => onEditColumnTitleChange?.(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        placeholder="שם העמודה"
                        title="שם העמודה"
                        className="text-center bg-white/80 border-2 border-amber-500 rounded focus:outline-none p-2 font-title text-sm"
                        style={{ color: settings.columnTitleColor }}
                    />
                    <select
                        value={editingColumn.columnType}
                        onChange={(e) => onEditColumnTypeChange?.(e.target.value as 'shabbat' | 'weekdays' | 'moed')}
                        className="text-center bg-white/80 border-2 border-amber-400 rounded focus:outline-none p-1 text-xs"
                        aria-label="סוג העמודה"
                        dir="rtl"
                    >
                        <option value="shabbat">שבת (השבת הקרובה)</option>
                        <option value="weekdays">ימות השבוע (א׳-ה׳)</option>
                        <option value="moed">מועד (תאריך ספציפי)</option>
                    </select>
                    {editingColumn.columnType === 'moed' && (
                        <input
                            type="date"
                            value={editingColumn.specificDate || ''}
                            onChange={(e) => onEditSpecificDateChange?.(e.target.value)}
                            title="תאריך מועד ספציפי"
                            className="text-center bg-white/80 border-2 border-amber-400 rounded focus:outline-none p-1 text-xs"
                        />
                    )}
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={onSaveColumnTitle}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded"
                        >
                            שמור
                        </button>
                        <button
                            onClick={() => onSetEditingColumn?.()}
                            className="bg-stone-300 hover:bg-stone-400 text-stone-700 text-xs font-bold py-1 px-3 rounded"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <h2
                        className="font-title cursor-pointer hover:opacity-80"
                        style={{ fontSize: titleFontSize, color: settings.columnTitleColor }}
                        onClick={isEditMode && onSetEditingColumn ? (e) => { e.stopPropagation(); onSetEditingColumn(); } : undefined}
                    >
                        {column.title}
                    </h2>
                    {isEditMode && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-500">
                                {getColumnTypeLabel(column.columnType)}
                                {column.columnType === 'moed' && column.specificDate && (
                                    <span className="mr-1">({new Date(column.specificDate).toLocaleDateString('he-IL')})</span>
                                )}
                            </span>
                            <button onClick={(e) => { e.stopPropagation(); onSetEditingColumn?.(); }} className="text-stone-400 hover:text-stone-800 p-0.5" title="ערוך עמודה">
                                <PencilIcon />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteColumn?.(column.id); }} className="text-red-500 hover:text-red-700 p-0.5" title="מחק עמודה">
                                <TrashIcon />
                            </button>
                        </div>
                    )}
                </>
            )}
        </header>
    );
};

export default ColumnHeader;
