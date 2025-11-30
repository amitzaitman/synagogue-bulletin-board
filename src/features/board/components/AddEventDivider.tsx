import React from 'react';

interface AddEventDividerProps {
    onClick: () => void;
}

const AddEventDivider: React.FC<AddEventDividerProps> = ({ onClick }) => {
    return (
        <div
            className="h-2 -my-1 relative group cursor-pointer z-10 flex items-center justify-center"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {/* Invisible hit area */}
            <div className="absolute inset-x-0 -top-2 -bottom-2 bg-transparent" />

            {/* Visible line on hover */}
            <div className="w-full h-0.5 bg-brand-accent/0 group-hover:bg-brand-accent/50 transition-colors duration-200 rounded-full" />

            {/* Plus icon on hover */}
            <div className="absolute bg-white text-brand-accent border border-brand-accent/0 group-hover:border-brand-accent/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-0 group-hover:scale-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
    );
};

export default AddEventDivider;
