// `process.env.NODE_ENV` on purpose: the consumer's bundler replaces it, while
// `import.meta.env.DEV` would be frozen at the library's own build time.
export const isDev = (): boolean => typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
