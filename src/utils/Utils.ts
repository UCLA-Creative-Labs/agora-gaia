// General utility functions

export function debug(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV !== 'production')
        console.log(message);
}
