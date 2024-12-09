import dotenv from 'dotenv';

dotenv.config();

export const MATCHING_HOST = process.env.MATCHING_HOST || 'localhost';
export const MATCHING_PORT = process.env.MATCHING_PORT || '3200';

export const HEALTHCHECK_HOST = process.env.HEALTHCHECK_HOST || 'localhost';
export const HEALTHCHECK_PORT = process.env.HEALTHCHECK_PORT || '3300';
export const HEALTHCHECK_URI = process.env.HEALTHCHECK_URI || '/check/availableSvr';
