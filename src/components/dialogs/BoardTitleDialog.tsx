import React from 'react';

interface BoardTitleDialogProps {
    tempBoardTitle: string;
    setTempBoardTitle: (value: string) => void;
    onSave: () => void;
}

const BoardTitleDialog: React.FC<BoardTitleDialogProps> = ({ tempBoardTitle, setTempBoardTitle, onSave }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-stone-800 mb-4 text-right">ברוכים הבאים!</h2>
                <p className="text-stone-600 mb-6 text-right">אנא הזן את שם בית הכנסת או הלוח:</p>
                <input
                    type="text"
                    value={tempBoardTitle}
                    onChange={(e) => setTempBoardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSave()}
                    placeholder="לדוגמה: בית הכנסת - גבעת החי״ש"
                    className="w-full p-3 border-2 border-stone-300 rounded-lg text-right text-lg focus:outline-none focus:border-amber-500 mb-6"
                    autoFocus
                    dir="rtl"
                />
                <button
                    onClick={onSave}
                    disabled={!tempBoardTitle.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    שמור והמשך
                </button>
            </div>
        </div>
    );
};

export default BoardTitleDialog;
