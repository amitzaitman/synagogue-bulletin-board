import React from 'react';

interface AddColumnDialogProps {
    newColumnTitle: string;
    newColumnType: 'shabbat' | 'weekdays' | 'moed';
    newColumnDate: string;
    setNewColumnTitle: (value: string) => void;
    setNewColumnType: (value: 'shabbat' | 'weekdays' | 'moed') => void;
    setNewColumnDate: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const AddColumnDialog: React.FC<AddColumnDialogProps> = ({
    newColumnTitle,
    newColumnType,
    newColumnDate,
    setNewColumnTitle,
    setNewColumnType,
    setNewColumnDate,
    onSave,
    onCancel
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-stone-800 mb-4 text-right">הוספת עמודה חדשה</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2 text-right">שם העמודה</label>
                        <input
                            type="text"
                            value={newColumnTitle}
                            onChange={(e) => setNewColumnTitle(e.target.value)}
                            placeholder="לדוגמה: ערב שבת"
                            className="w-full p-3 border-2 border-stone-300 rounded-lg text-right focus:outline-none focus:border-amber-500"
                            title="שם העמודה"
                            autoFocus
                            dir="rtl"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2 text-right">סוג העמודה</label>
                        <select
                            value={newColumnType}
                            onChange={(e) => setNewColumnType(e.target.value as 'shabbat' | 'weekdays' | 'moed')}
                            className="w-full p-3 border-2 border-stone-300 rounded-lg text-right focus:outline-none focus:border-amber-500"
                            title="סוג העמודה"
                            dir="rtl"
                        >
                            <option value="shabbat">שבת (השבת הקרובה)</option>
                            <option value="weekdays">ימות השבוע (א׳-ה׳)</option>
                            <option value="moed">מועד (תאריך ספציפי)</option>
                        </select>
                    </div>

                    {newColumnType === 'moed' && (
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2 text-right">תאריך המועד</label>
                            <input
                                type="date"
                                value={newColumnDate}
                                onChange={(e) => setNewColumnDate(e.target.value)}
                                title="תאריך המועד"
                                className="w-full p-3 border-2 border-stone-300 rounded-lg text-right focus:outline-none focus:border-amber-500"
                                dir="rtl"
                            />
                        </div>
                    )}

                    <div className="text-xs text-stone-500 text-right mt-2 space-y-1">
                        {newColumnType === 'shabbat' && (
                            <p>זמנים כמו שקיעה יחושבו לפי השבת הקרובה</p>
                        )}
                        {newColumnType === 'weekdays' && (
                            <p>זמנים כמו שקיעה יחושבו לפי השקיעה המוקדמת ביותר בימים א׳-ה׳</p>
                        )}
                        {newColumnType === 'moed' && (
                            <p>זמנים כמו שקיעה יחושבו לפי התאריך הספציפי שבחרת</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        הוסף עמודה
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddColumnDialog;
