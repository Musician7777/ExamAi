'use client';
const isDev = process.env.NODE_ENV === 'development';

const noop = () => {};

const clientLogger = {
  error: console.error, // always log errors — critical for production debugging
  warn: isDev ? console.warn : noop,
  info: isDev ? console.log : noop, // eslint-disable-line no-console
  debug: isDev ? console.debug : noop, // eslint-disable-line no-console
};

export default clientLogger;
