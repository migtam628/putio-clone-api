import fs, { statSync } from 'fs';
import path from 'path';
import { VIDEO_PATH } from '../services/config.js';

const STREAM = (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(VIDEO_PATH, fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found.');
    }

    const stat = statSync(filePath); // Get the file stats

    const total = stat.size; // File size

    const range = req.headers.range; // Range requested from the client

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1; // Ensure valid range

        if (start >= total || end >= total || start > end) {
            res.status(416).send('Requested Range Not Satisfiable');
            return;
        }

        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, {
            start,
            end
        });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4'
        });
        fileStream.pipe(res);
    } else {
        // Handle no-range case: send the entire file
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'video/mp4'
        });
        fs.createReadStream(filePath).pipe(res);
    }
};

export default STREAM;