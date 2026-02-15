/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string
    readonly VITE_FIREBASE_AUTH_DOMAIN: string
    readonly VITE_FIREBASE_PROJECT_ID: string
    readonly VITE_FIREBASE_STORAGE_BUCKET: string
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
    readonly VITE_FIREBASE_APP_ID: string
    readonly APP_VERSION: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'react-fitty' {
    import React from 'react';
    export interface ReactFittyProps {
        children?: React.ReactNode;
        minSize?: number;
        maxSize?: number;
        wrapText?: boolean;
    }
    export const ReactFitty: React.FC<ReactFittyProps>;
}
