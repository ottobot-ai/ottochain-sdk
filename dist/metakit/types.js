"use strict";
/**
 * Core type definitions for the Ottochain SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTELLATION_PREFIX = exports.ALGORITHM = void 0;
/**
 * Supported signature algorithm
 */
exports.ALGORITHM = 'SECP256K1_RFC8785_V1';
/**
 * Constellation prefix for DataUpdate signing
 */
exports.CONSTELLATION_PREFIX = '\x19Constellation Signed Data:\n';
