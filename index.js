import fs from 'fs';
import path from 'path';
import cors from 'cors';
import express from 'express';
import { transcodeMkvToMp4 } from './src/services/functions.js';
import { app, VIDEO_PATH, upload, __dirname, watcher } from './src/services/config.js';
import { ACTIVE_DOWNLOADS, ACTIVE_TORRENTS, DELETE_ALL_DIRECTORIES, DELETE_ALL_FILES, DELETE_DIRECTORY, DETELE_FILE, FILES, HOME, LIST_DIRECTORIES, LIST_FILES, STOP_ALL_DOWNLOADS, STOP_DOWNLOAD, STREAM, UPLOAD_TORRENT } from './src/controllers/index.js';

/* ************************************************************************************************************************************************************************************ */

// Middleware for parsing JSON requests
app.use(express.json()); // Add this to parse incoming JSON data
app.use(express.urlencoded({ extended: true })); // To handle form-encoded data
app.use(cors())

// add cross origin resource sharing
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.static('public'));
app.use(express.static('dist'));


/* ************************************************************************************************************************************************************************************ */


if (!fs.existsSync(VIDEO_PATH)) {
    fs.mkdirSync(VIDEO_PATH, { recursive: true });
}


watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mp4FilePath = filePath.replace('.mkv', '.mp4').slice(filePath.lastIndexOf('/') + 1)
    if (ext === '.mkv' && !filePath.includes('.mp4') && !fs.existsSync(VIDEO_PATH + '/' + mp4FilePath) ) {
        const mp4FilePath = filePath.replace('.mkv', '.mp4').slice(filePath.lastIndexOf('/') + 1)
        transcodeMkvToMp4(filePath, VIDEO_PATH + '/' + mp4FilePath);
        console.log({ mp4FilePath });
        console.log('Transcoding .mkv to .mp4:', filePath);

    }
});

watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp4') {
        console.log('Transcoding .mkv to .mp4:', filePath);
    }
    console.log('File added:', filePath);
});


/* ************************************************************************************************************************************************************************************ */

app.get('/', HOME);

app.get('/stream/:fileName', STREAM);

app.delete('/delete-file/:fileName', DETELE_FILE);

app.delete('/delete-all-files', DELETE_ALL_FILES);

app.delete('/delete-directory', DELETE_DIRECTORY);

app.delete('/delete-all-directories', DELETE_ALL_DIRECTORIES);

app.get('/list-files', LIST_FILES);

app.post('/upload-torrent', upload.single('torrent'), UPLOAD_TORRENT);

app.get('/active-torrents', ACTIVE_TORRENTS);

app.get('/active-downloads', ACTIVE_DOWNLOADS);

app.get('/stop-download', STOP_DOWNLOAD);

app.get('/stop-all-downloads', STOP_ALL_DOWNLOADS);

app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));

app.get('/files/:fileName', FILES);

app.get('/list-directories', LIST_DIRECTORIES);

/* ************************************************************************************************************************************************************************************ */

// Start the server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

