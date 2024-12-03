import dotenv from 'dotenv';

dotenv.config();

export const LOBBY_HOST = process.env.LOBBY_HOST || 'localhost';
export const LOBBY_PORT = process.env.LOBBY_PORT || '3000';
