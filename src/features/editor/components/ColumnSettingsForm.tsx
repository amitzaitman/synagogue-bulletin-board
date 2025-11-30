import React, { useState, useEffect } from 'react';
import { Column, ColumnType } from '../../../shared/types/types';

interface ColumnSettingsFormProps {
    column: Column;
    onSave: (column: Column) => void;
    onCancel: () => void;
    onDelete: (columnId: string) => void;
}

const ColumnSettingsForm: React.FC<ColumnSettingsFormProps> = ({ column, onSave, onCancel, onDelete }) => {
    const [title, setTitle] = useState(column.title);
    const [columnType, setColumnType] = useState<ColumnType>(column.columnType);
    const [specificDate, setSpecificDate] = useState(column.specificDate || '');

    // Update local state when column prop changes
    useEffect(() => {
        setTitle(column.title);
        setColumnType(column.columnType);
        setSpecificDate(column.specificDate || '');
    }, [column]);

    const handleSave = () => {
        onSave({
            ...column,
            title,
            columnType,
            specificDate: columnType === 'moed' ? specificDate : undefined
        });
    };

    const inputClass = "w-full p-2 border rounded-md bg-white/50 text-sm focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all";
    const labelClass = "block text-sm font-medium text-stone-700 mb-1";

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h3 className="text-lg font-bold text-stone-800 border-b pb-2">עריכת עמודה</h3>

            <div className="space-y-4">
                <div>
                    <label className={labelClass}>כותרת העמודה</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputClass}
                        placeholder="לדוגמה: שחרית, שיעורים"
                        data-testid="column-title-input"
                    />
                </div>

                <div>
                    <label className={labelClass}>סוג עמודה</label>
                    <select
                        value={columnType}
                        onChange={(e) => setColumnType(e.target.value as ColumnType)}
                        className={inputClass}
                        data-testid="column-type-select"
                    >
                        <option value="weekdays">ימות השבוע (א׳-ה׳)</option>
                        <option value="shabbat">שבת (פרשת השבוע)</option>
                        <option value="moed">מועד (תאריך ספציפי)</option>
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                        {columnType === 'weekdays' && 'מציג זמנים לימי החול הקרובים'}
                        {columnType === 'shabbat' && 'מציג זמני כניסת/צאת שבת ותפילות שבת'}
                        {columnType === 'moed' && 'מציג זמנים לתאריך לועזי ספציפי'}
                    </p>
                </div>

                {columnType === 'moed' && (
                    <div className="animate-fade-in">
                        <label className={labelClass}>תאריך</label>
                        <input
                            type="date"
                            value={specificDate}
                            onChange={(e) => setSpecificDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t mt-6">
                <button
                    onClick={() => {
                        if (window.confirm('האם אתה בטוח שברצונך למחוק עמודה זו? כל האירועים בה יימחקו.')) {
                            onDelete(column.id);
                        }
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 rounded hover:bg-red-50 transition-colors"
                >
                    מחק עמודה
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md text-sm font-medium transition-colors"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-brand-accent hover:bg-brand-dark text-white rounded-md text-sm font-medium shadow-sm transition-colors"
                    >
                        שמור שינויים
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColumnSettingsForm;
