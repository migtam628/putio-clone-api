import fs from 'fs';
import path from 'path';
import { VIDEO_PATH } from '../services/config.js';

const DELETE_FILE = (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(VIDEO_PATH, fileName);

    try {
        // Check if the path exists
        if (fs.existsSync(filePath)) {
            const stat = fs.lstatSync(filePath);

            if (stat.isFile()) {
                // Delete the file
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        return res.status(500).send('Error deleting file.');
                    }
                    console.log(`File deleted: ${filePath}`);
                    res.status(200).send(`File ${fileName} deleted successfully.`);
                });
            } else if (stat.isDirectory()) {
                // Delete the directory (use fs.rm for recursive deletion in Node.js v12.10.0+)
                fs.rm(filePath, { recursive: true, force: true }, (err) => {
                    if (err) {
                        console.error('Error deleting directory:', err);
                        return res.status(500).send('Error deleting directory.');
                    }
                    console.log(`Directory deleted: ${filePath}`);
                    res.status(200).send(`Directory ${fileName} deleted successfully.`);
                });
            } else {
                res.status(400).json({
                    error: `Unsupported file type: ${fileName}`,
                    code: 'UNSUPPORTED_FILE_TYPE'
                });
            }
        } else {
            res.status(404).json({
                error: `File or directory ${fileName} not found.`,
                code: 'FILE_NOT_FOUND'
            });
        }
    } catch (error) {
        console.error('Error deleting file or directory:', error);
        res.status(500).send('Error deleting file or directory.');
    }
};

export default DELETE_FILE;
