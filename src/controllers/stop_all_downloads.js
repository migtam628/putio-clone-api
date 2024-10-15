import {stopAllDownloads  } from '../services/functions.js'

const STOP_ALL_DOWNLOADS = (req, res) => {
    stopAllDownloads();
    activeTorrents = [];
    res.status(200).send('All downloads stopped.');
}

export default STOP_ALL_DOWNLOADS;