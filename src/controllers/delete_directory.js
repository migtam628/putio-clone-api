import path from 'path';
import fs from 'fs';
import { VIDEO_PATH } from '../services/config.js';
import { deleteFolderRecursive } from '../services/functions.js';

const DELETE_DIRECTORY = (req, res) => {
    const directoryName = req.query.name;
    const fullPath = path.join(VIDEO_PATH, directoryName);

    deleteFolderRecursive(fullPath);

    res.json({ message: `Directory ${directoryName} deleted.` });
};


export default DELETE_DIRECTORY;