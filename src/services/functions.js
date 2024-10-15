import fs from 'fs';
import path from 'path';
import { VIDEO_PATH } from './config.js';
import { exec } from 'child_process';
import { client } from './config.js';


export function streamVideo(filePath, range, res) {
    const stat = fs.statSync(filePath);
    const total = stat.size;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4'
        });
        fileStream.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'video/mp4'
        });
        fs.createReadStream(filePath).pipe(res);
    }
}


export function stopAllDownloads() {
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

export const deleteFolderRecursive = function (folderPath) {
    deleteFolder(folderPath);
    // if (fs.existsSync(folderPath)) {
    //     fs.readdirSync(folderPath).forEach((file) => {
    //         const curPath = path.join(folderPath, file);
    //         if (fs.lstatSync(curPath).isDirectory()) {
    //             deleteFolderRecursive(curPath); // Recursive delete
    //         } else {
    //             fs.unlinkSync(curPath); // Delete file
    //         }
    //     });
    //     fs.rmdirSync(folderPath); // Remove the directory itself
    // }
};

export const deleteFolder = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.rmdirSync(folderPath, { recursive: true });
    }
}

export function displayActiveDownloads() {
    try {
        if (client.torrents.length === 0) {
            console.log('No active downloads.');
            return [];
        }

        let totalProgress = 0;
        client.torrents.forEach((torrent) => {
            totalProgress += torrent.progress;
        });

        let magnetLinks = [];
        client.torrents.forEach((torrent) => {
            magnetLinks.push(torrent.magnetLink);
        });


        console.log(`Total progress: ${(totalProgress / client.torrents.length * 100).toFixed(2)}%`);

        let downloads = [];
        client.torrents.forEach((torrent) => {
            downloads.push({
                name: torrent.name,
                progress: (torrent.progress * 100).toFixed(2),
                magnetLink: torrent.magnetURI,
                downloadSpeed: torrent.downloadSpeed,
                uploaded: torrent.uploaded,
                downloaded: torrent.downloaded,
                numPeers: torrent.numPeers,
                timeRemaining: torrent.timeRemaining,
                announce: torrent.announce,
                path: torrent.path,
                length: torrent.length,
                size: torrent.size,
                type: torrent.type,
                offset: torrent.offset,
                done: torrent.done,
                hash: torrent.infoHash,
                // files: torrent.files.map(file => ({
                //     name: file.name,
                //     path: file.path,
                //     length: file.length,
                //     size: file.size,
                //     type: file.type,
                //     offset: file.offset,
                //     done: file.done
                // })),
            });
        });

        console.table(downloads);

        return downloads;
    } catch (error) {

        console.error('Error displaying active downloads:', error);
        return [];

    }
}



// Function to handle file processing
export function handleFile(file, res) {
    try {
        const outputPath = path.join(VIDEO_PATH, file.name);
        const fileStream = file.createReadStream();

        const writeStream = fs.createWriteStream(outputPath);
        fileStream.pipe(writeStream);

        writeStream.on('finish', () => {
            console.log(`File saved to ${outputPath}`);
            res.status(200).json({
                message: 'File downloaded and saved successfully.',
                fileName: file.name,
            });
        });

        writeStream.on('error', (err) => {
            console.error('Error writing the file:', err);
            res.status(500).send('Error saving the file.');
        });
    } catch (error) {

        console.error('Error writing the file:', error);
        res.status(500).json({ error: 'An error occurred while saving the file.' });

    }
}


export function transcodeMkvToMp4(inputPath, outputPath) {
    exec(`ffmpeg -i "${inputPath}" -codec copy "${outputPath}"`, (err) => {
        if (err) {
            console.error('Error transcoding file:', err);
            return;
        }
        console.log('Transcoding completed successfully:', outputPath);
        // Optionally delete the original .mkv file after conversion
        // fs.unlinkSync(inputPath);
    });
}
