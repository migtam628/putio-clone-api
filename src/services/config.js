import express from 'express';
import multer from 'multer';
import WebTorrent from 'webtorrent';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chokidar from 'chokidar';

export const app = express();
export const client = new WebTorrent();
export const upload = multer(); // Middleware for handling multipart/form-data

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const VIDEO_PATH = join(__dirname, 'public', 'videos');

export let activeTorrents = [];


export const watcher = chokidar.watch(VIDEO_PATH, {
    ignored: /\.mp4$/, // Ignore existing .mp4 files - avoid infinite loops
    persistent: true, // Keep watching
    awaitWriteFinish: { // Wait for file to be fully written before processing
        stabilityThreshold: 2000, // 2 seconds
        pollInterval: 100 // Check every 100ms
    }
});