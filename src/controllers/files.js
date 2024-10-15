import fs from 'fs';
import path from 'path';
import { VIDEO_PATH } from '../services/config.js';
import { streamVideo } from '../services/functions.js';

const FILES = (req, res) => {
    const filePath = path.join(VIDEO_PATH, req.params.fileName);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    const range = req.headers.range;
    streamVideo(filePath, range, res);
}

export default FILES;