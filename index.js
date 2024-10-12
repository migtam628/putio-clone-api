import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import WebTorrent from 'webtorrent';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { exec } from 'child_process';
// ffmpeg
// import ffmpeg from 'fluent-ffmpeg';
import chokidar from 'chokidar';  // Import chokidar

const app = express();
const client = new WebTorrent();
const upload = multer(); // Middleware for handling multipart/form-data

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directory where downloaded videos will be saved
const VIDEO_PATH = path.join(__dirname, 'public', 'videos');

// Array to keep track of active torrents
let activeTorrents = [];
let activeDownloads = [];

// Middleware for parsing JSON requests
app.use(express.json()); // Add this to parse incoming JSON data
app.use(express.urlencoded({ extended: true })); // To handle form-encoded data

// add cross origin resource sharing
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    //res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    //res.setHeader('Access-Control-Allow-Credentials', true);
    // res.setHeader('Content-Type', 'application/json');

    next();
});
// Serve static files from public folder
app.use(express.static('public'));
// app.use(express.static('putonline/dist'));

// Watch the video directory for new .mkv files
const watcher = chokidar.watch(VIDEO_PATH, {
    ignored: /\.mp4$/, // Ignore existing .mp4 files - avoid infinite loops
    persistent: true, // Keep watching
    awaitWriteFinish: { // Wait for file to be fully written before processing
        stabilityThreshold: 2000, // 2 seconds
        pollInterval: 100 // Check every 100ms
    }
});


// function transcodeMkvToMp4(inputPath, outputPath) {
//     exec(`ffmpeg -i "${inputPath}" -codec copy "${outputPath}"`, (err) => {
//         if (err) {
//             console.error('Error transcoding file:', err);
//             // Consider adding error handling (e.g., deleting the partial .mp4)
//             return;
//         }
//         console.log('Transcoding completed successfully:', outputPath);

//         // Optional: Delete the original .mkv file
//        // fs.unlinkSync(inputPath);
//     });
// }


watcher.on('add', (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mkv') {
        const mp4FilePath = filePath.replace('.mkv', '.mp4').slice(filePath.lastIndexOf('/') + 1)
        transcodeMkvToMp4(filePath, VIDEO_PATH + '/' + mp4FilePath);
        console.log({ mp4FilePath });
        console.log('Transcoding .mkv to .mp4:', filePath);

    }
    // console.log('New file added:', filePath);
    // alert('New file added');
});

watcher.on('all', (r) => {
    console.log('All:', r);
});

// /Users/mig/Downloads/putio_clone_project/public/videos/Black.Panther.2018.1080p.BluRay.x264-[YTS.AM].mp4
// Stream video route - EXAMPLE CODE
app.get('/stream/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(VIDEO_PATH, fileName);

    if
        (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found.');
    }

    const stat = fs.statSync(filePath); // Get the file stats
    const total = stat.size; // File size
    const range = req.headers.range; // Range requested from the client

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

        // Ensure valid range
        if (start >= total || end >= total || start > end) {
            res.status(416).send('Requested Range Not Satisfiable');
            return;
        }

        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        // Send partial content response
        res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': chunkSize, 'Content-Type': 'video/mp4' });
        fileStream.pipe(res);
    } else {
        // Handle no-range case: send the entire file
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'video/mp4'
        });

        fs.createReadStream(filePath).pipe(res);
    }
});



// New route to list all files in the videos directory
app.get('/list-files', (req, res) => {
    fs.readdir(VIDEO_PATH, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory.');
        }
        // Send the list of files as JSON
        res.json(files);
    });
});

// Torrent download route
app.post('/upload-torrent', upload.single('torrent'), (req, res) => {
    const magnetLink = req.body.magnet_link;

    // Check if the magnet link was provided
    if (!magnetLink) {
        return res.status(400).send('Magnet link is required.');
    }

    // Check if the torrent is already downloading
    if (activeTorrents.includes(magnetLink)) {
        return res.status(400).send('This torrent is already being downloaded.');
    }

    // Add magnet link to active torrents
    activeTorrents.push(magnetLink);

    // Start downloading torrent
    client.add(magnetLink, { path: VIDEO_PATH }, (torrent) => {
        console.log(`Torrent infoHash: ${torrent.infoHash}`);

        torrent.on('done', () => {
            console.log(`Finished downloading ${torrent.name}`);

            // Find the first .mp4 file in the torrent
            const file = torrent.files.find((file) => file.name.endsWith('.mp4'));
            const mp4File = torrent.files.find((file) => file.name.endsWith('.mp4'));
            const mkvFile = torrent.files.find((file) => file.name.endsWith('.mkv'));

            // const filePath = path.join(VIDEO_PATH, file.name);
            // const fileExt = path.extname(file.name);

            // file.getBuffer((err, buffer) => {
            //     if (err) throw err;

            //     fs.writeFileSync(filePath, buffer);
            //     console.log(`Downloaded: ${filePath}`);

            //     // Convert .mkv to .mp4 if needed
            //     if (fileExt === '.mkv') {
            //         const outputFilePath = filePath.replace('.mkv', '.mp4');

            //         convertToMp4(filePath, outputFilePath)
            //             .then((output) => {
            //                 console.log(`Converted to MP4: ${output}`);
            //                 res.status(200).send({
            //                     message: 'File downloaded and converted to MP4.',
            //                     fileName: path.basename(output),
            //                 });
            //             })
            //             .catch((err) => {
            //                 res.status(500).send('Error converting file to MP4');
            //                 console.error(err);
            //             });
            //     } else {
            //         res.status(200).send({
            //             message: 'File downloaded successfully.',
            //             fileName: file.name,
            //         });
            //     }
            // });

            // Handle MP4 or MKV Files
            if (mp4File) {
                handleFile(mp4File, res);
            } else if (mkvFile) {
                const mkvFilePath = path.join(VIDEO_PATH, mkvFile.name);
                const mp4FilePath = path.join(VIDEO_PATH, mkvFile.name.replace('.mkv', '.mp4'));

                // Convert .mkv to .
                transcodeMkvToMp4(mkvFilePath, mp4FilePath);

                // Handle the MP4 file
                handleFile(mkvFile, res);
            } else {
                return res.status(400).send('No suitable video files found in the torrent.');
            }
        });
    });
});


// Serve a basic page for uploading torrents and streaming videos
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.get('/active-torrents', (req, res) => {
    res.json(activeTorrents);
});

app.get('/active-downloads', (req, res) => {
    const downloads = displayActiveDownloads();
    res.json(downloads);
});

app.get('/stop-download', (req, res) => {
    const magnetLink = req.query.magnet_link;
    const hash = req.query.hash;
    if (!magnetLink) {
        return res.status(400).send('Magnet link is required.');
    }

    const torrent = client.get(magnetLink);
    if (!torrent) {
        return res.status(404).send('Torrent not found.');
    }

    torrent.destroy(() => {
        console.log(`Stopped downloading ${torrent.name}`);
        activeTorrents = activeTorrents.filter((link) => link !== magnetLink);
        res.status(200).send('Download stopped successfully.');
    });
});

app.get('/stop-all-downloads', (req, res) => {
    stopAllDownloads();
    activeTorrents = [];
    res.status(200).send('All downloads stopped.');
});

app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));


function stopAllDownloads() {
    client.torrents.forEach(torrent => {
        torrent.destroy(err => {
            if (err) {
                console.error(`Error stopping ${torrent.name}:`, err);
            } else {
                console.log(`Successfully stopped ${torrent.name}`);
            }
        });
    });
}

function displayActiveDownloads() {
    if (client.torrents.length === 0) {
        console.log('No active downloads.');
        return [];
    }

    let totalProgress = 0;
    client.torrents.forEach((torrent) => {
        totalProgress += torrent.progress;
    });

    console.log(`Total progress: ${(totalProgress / client.torrents.length * 100).toFixed(2)}%`);

    let downloads = [];
    client.torrents.forEach((torrent) => {
        downloads.push({
            name: torrent.name,
            progress: (torrent.progress * 100).toFixed(2),
            downloadSpeed: torrent.downloadSpeed,
            uploaded: torrent.uploaded,
            downloaded: torrent.downloaded,
            numPeers: torrent.numPeers,
        });
    });

    console.table(downloads);

    return downloads;
}



// Function to handle file processing
function handleFile(file, res) {
    const outputPath = path.join(VIDEO_PATH, file.name);
    const fileStream = file.createReadStream();

    const writeStream = fs.createWriteStream(outputPath);
    fileStream.pipe(writeStream);

    writeStream.on('finish', () => {
        console.log(`File saved to ${outputPath}`);
        res.status(200).send({
            message: 'File downloaded and saved successfully.',
            fileName: file.name,
        });
    });

    writeStream.on('error', (err) => {
        console.error('Error writing the file:', err);
        res.status(500).send('Error saving the file.');
    });
}

// Function to convert .mkv to .mp4
// function transcodeMkvToMp4(inputPath, outputPath, res) {
//     // Log the full command for debugging purposes
//     const command = `ffmpeg -i "${inputPath}" -codec copy "${outputPath}"`;
//     console.log('Executing command:', command);

//     exec(command, (err, stdout, stderr) => {
//         if (err) {
//             console.error('Error transcoding file:', err);
//             console.error('FFmpeg stderr:', stderr);
//             return res.status(500).send('Error transcoding file.');
//         }

//         console.log('FFmpeg stdout:', stdout);
//         console.log({
//             message: 'Transcoding completed successfully.',
//             fileName: path.basename(outputPath),
//         });

//         return res.status(200).send({
//             message: 'Transcoding completed successfully.',
//             fileName: path.basename(outputPath),
//         });
//     });
// }


// function transcodeMkvToMp4(inputPath, outputPath, res) {
//     exec(`ffmpeg -i "${inputPath}" -codec copy "${outputPath}"`, (err) => {
//         if (err) {
//             console.error('Error transcoding file:', err);
//             return res.status(500).send('Error transcoding file.');
//         }

//         console.log({
//             message: 'Transcoding completed successfully.',
//             fileName: path.basename(outputPath),
//         });
//     });
// }

// function transcodeMkvToMp4(inputPath, outputPath) {
//     // Implement your transcoding logic here, possibly using ffmpeg
//     // Example: 
//     exec(`ffmpeg -i "${inputPath}" -codec copy "${outputPath}"`, (err) => {
//         if (err) {
//             console.error('Error transcoding file:', err);
//             return;
//         }
//         console.log('Transcoding completed successfully.');
//     });
// }

function transcodeMkvToMp4(inputPath, outputPath, res) {
    if (!fs.existsSync(inputPath)) {
        console.log('File not found:', inputPath);
        return;
        // return res.status(404).send('File not found.');
    }

    // if input file is ".DS_Store" file, return else if file extension is any video file
    console.log('File extension:', path.extname(inputPath).toLowerCase());
    if (path.basename(inputPath) === '.DS_Store') {
        console.log('File not found:', inputPath);
        return;
        // return res.status(404).send('File not
    } else if (!['.mkv', '.mp4', '.avi', '.mov', '.flv', '.wmv', '.webm'].includes(path.extname(inputPath).toLowerCase())) {
        console.log('Unsupported file format:', inputPath);
        return;
        // return res.status(400).send('Unsupported file format.');
    }

    // Use a more general command with codecs
    // const command = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -preset fast -strict experimental "${outputPath}" -progress - `;
    const command = `ffmpeg -i "${inputPath}" -codec copy "${outputPath}"`;
    console.log('Executing command:', command);

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error('Error transcoding file:', err);
            console.error('FFmpeg stderr:', stderr);
            if (res) {
                return res.status(500).send('Error transcoding file.');
            }
            return;
        }

        console.log('FFmpeg stdout:', stdout);
        console.log({
            message: 'Transcoding completed successfully.',
            fileName: path.basename(outputPath),
        });

        // remove old .mkv file from the dir
        // fs.unlinkSync(inputPath);

        if (res) {
            return res.status(200).send({
                message: 'Transcoding completed successfully.',
                fileName: path.basename(outputPath),
            });
        }
    });
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
