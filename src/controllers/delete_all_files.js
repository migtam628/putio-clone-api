import fs from 'fs';
import path from 'path';
import { VIDEO_PATH } from '../services/config.js';


const DELETE_ALL_FILES = (req, res) => {
    fs.readdir(VIDEO_PATH, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory.');
        }

        // Loop through all files and delete them
        files.forEach(file => {
            const filePath = path.join(VIDEO_PATH, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                } else {
                    console.log(`File deleted: ${filePath}`);
                }
            });
        });

        res.status(200).send('All files deleted successfully.');
    });
}

export default DELETE_ALL_FILES;