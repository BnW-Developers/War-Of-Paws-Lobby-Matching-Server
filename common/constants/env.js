import dotenv from 'dotenv';

dotenv.config();

/* ======================= SERVER HOST ========================= */
export const DISTRIBUTOR_HOST = process.env.DISTRIBUTOR_HOST || 'localhost';
export const GATE_HOST = process.env.GATE_HOST || 'localhost';

/* ======================= SERVER PORT ========================= */
export const DISTRIBUTOR_PORT = process.env.DISTRIBUTOR_PORT || '3100';
export const GATE_PORT = process.env.GATE_PORT || '3000';

/* ============================ D B ============================ */
export const DB1_NAME = process.env.DB1_NAME || 'db1';
export const DB1_USER = process.env.DB1_USER || 'root';
export const DB1_PASSWORD = process.env.DB1_PASSWORD || '1q2w3e4r';
export const DB1_HOST = process.env.DB1_HOST || 'localhost';
export const DB1_PORT = process.env.DB1_PORT || 3306;

export const DB2_NAME = process.env.DB2_NAME || 'db2';
export const DB2_USER = process.env.DB2_USER || 'root';
export const DB2_PASSWORD = process.env.DB2_PASSWORD || '1q2w3e4r';
export const DB2_HOST = process.env.DB2_HOST || 'localhost';
export const DB2_PORT = process.env.DB2_PORT || 3306;

/* ============================REDIS============================= */
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT || 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '1q2w3e4r';
export const REDIS_DATABASE = process.env.REDIS_DATABASE || 0;
