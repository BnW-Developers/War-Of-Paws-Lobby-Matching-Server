import dotenv from 'dotenv';

dotenv.config();

export const MATCHING_HOST = process.env.MATCHING_HOST || 'localhost';
export const MATCHING_PORT = process.env.MATCHING_PORT || '3200';
