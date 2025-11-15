import React, { useState, useEffect } from 'react';
import { HDate } from '@hebcal/core';

// Helper function to remove Hebrew vowel points and cantillation marks
const removeNikud = (text: string): string => {
    if (!text) return '';
    return text.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');
};

interface HebrewDateProps {
    scale?: number; // Scale factor for proportional sizing
}

const HebrewDate: React.FC<HebrewDateProps> = ({ scale = 1 }) => {
    const [hebrewDate, setHebrewDate] = useState('');

    useEffect(() => {
        const update = () => {
            const hd = new HDate();
            const formattedDate = removeNikud(hd.renderGematriya());
            setHebrewDate(formattedDate);
        };
        
        update(); // initial update
        const intervalId = setInterval(update, 30 * 1000); // update every 30 seconds

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    if (!hebrewDate) return null;

    const baseFontSize = 16; // Base font size in pixels
    const scaledFontSize = baseFontSize * scale;

    return (
        <div 
            className="text-stone-600 leading-tight" 
            style={{ 
                fontSize: `${1.5* scaledFontSize}px`,
                marginTop: `${scale * 4}px`
            }}
            aria-label={`התאריך העברי היום: ${hebrewDate}`}
        >
            {hebrewDate}
        </div>
    );
};

export default HebrewDate;
