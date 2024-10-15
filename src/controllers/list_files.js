import { VIDEO_PATH } from '../services/config.js';
import fs from 'fs';
import path from 'path';

const LIST_FILES = (req, res) => {
    const dir = VIDEO_PATH;

    fs.readdir(dir, (err, items) => {
        if (err) return res.status(500).json({ error: 'Error reading directory', err });

        const fileList = items.map(item => {
            const itemPath = path.join(dir, item);
            const isDirectory = fs.statSync(itemPath).isDirectory();
            
            return { name: item, isDirectory };
        });

        res.json(fileList);
    });
}

export default LIST_FILES;