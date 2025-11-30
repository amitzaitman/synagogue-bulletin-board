export const logVersion = () => {
    const version = import.meta.env.APP_VERSION || 'unknown';
    console.log(
        `%c App Version: ${version} `,
        'background: #222; color: #bada55; padding: 4px; border-radius: 4px;'
    );
};
