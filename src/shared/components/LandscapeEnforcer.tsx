import React, { useEffect, useState } from 'react';

interface LandscapeEnforcerProps {
    children: React.ReactNode;
    allowPortrait?: boolean;
}

const LandscapeEnforcer: React.FC<LandscapeEnforcerProps> = ({ children, allowPortrait = false }) => {
    const [isPortrait, setIsPortrait] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const checkOrientation = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setIsPortrait(height > width);
            setDimensions({ width, height });
        };

        checkOrientation();

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (isPortrait && !allowPortrait) {
        return (
            <div
                style={{
                    width: `${dimensions.height}px`, // Swap width and height
                    height: `${dimensions.width}px`,
                    transform: 'rotate(90deg)',
                    transformOrigin: 'top left',
                    position: 'fixed',
                    top: 0,
                    left: '100%', // Move to the right edge to rotate back into view
                    overflow: 'hidden',
                    zIndex: 9999,
                    backgroundColor: 'black', // Ensure background covers everything
                }}
            >
                {children}
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            width: '100%',
            height: '100%'
        }}>
            {children}
        </div>
    );
};

export default LandscapeEnforcer;
