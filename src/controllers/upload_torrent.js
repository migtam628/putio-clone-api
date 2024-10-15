import path from 'path';
import { client, VIDEO_PATH, activeTorrents } from '../services/config.js';
import { handleFile, transcodeMkvToMp4 } from '../services/functions.js';
import fs from 'fs';

const UPLOAD_TORRENT = (req, res) => {
    const magnetLink = req.body.magnet_link;
    const name = req.body.name;

    if (!magnetLink) {
        return res.status(400).send('Magnet link is required.');
    }

    if (activeTorrents.includes(magnetLink)) {
        return res.status(400).send('This torrent is already being downloaded.');
    }

    try {
        client.add(magnetLink, { path: VIDEO_PATH }, (torrent) => {
            
            const mp4File = torrent.files.find((file) => file.name.endsWith('.mp4'));
            const mkvFile = torrent.files.find((file) => file.name.endsWith('.mkv'));
            if (!mp4File && !mkvFile) {
                return res.status(400).send('No suitable video files found in the torrent.');
            }
            const file = mp4File || mkvFile;

            console.log({
                torrent,
                file
            });
            activeTorrents.push({
                magnetLink,
                announce: torrent.announce,
                name: file.name,
                path: file.path,
                length: file.length,
                size: file.size,
                type: file.type,
                offset: file.offset,
                done: file.done,
                hash: torrent.infoHash
            });

            console.log(`Torrent infoHash: ${torrent.infoHash}`);

            torrent.on('done', () => {
                console.log(`Finished downloading ${torrent.name}`);

                const mp4File = torrent.files.find((file) => file.name.endsWith('.mp4'));
                const mkvFile = torrent.files.find((file) => file.name.endsWith('.mkv'));

                if (mp4File) {
                    handleFile(mp4File, res);
                } else if (mkvFile) {
                    const mkvFilePath = path.join(VIDEO_PATH, mkvFile.name);
                    const mp4FilePath = path.join(VIDEO_PATH, mkvFile.name.replace('.mkv', '.mp4'));

                    transcodeMkvToMp4(mkvFilePath, mp4FilePath);
                    // handleFile(mkvFile, res);
                    deleteFileFolderPath(mkvFilePath);

                } else {
                    return res.status(400).send('No suitable video files found in the torrent.');
                }

                torrent.files.forEach((file, index) => {
                    activeTorrents.push({
                        magnetLink,
                        announce: torrent.announce,
                        name: file.name,
                        path: file.path,
                        length: file.length,
                        size: file.size,
                        type: file.type,
                        offset: file.offset,
                        done: file.done,
                        hash: torrent.infoHash,
                        index: index
                    });
                });
            });
        });
    } catch (error) {
        console.error(error);
        // activeTorrents = activeTorrents.filter((link) => link !== magnetLink);
        return res.status(500).json({ error: 'An error occurred while adding the torrent.' });
    }
}

function deleteFileFolderPath(path) {
    fs.rmSync(path, { recursive: true, force: true });
}

export default UPLOAD_TORRENT;