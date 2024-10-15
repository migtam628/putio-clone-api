import { displayActiveDownloads } from "../services/functions.js";

const ACTIVE_DOWNLOADS = (req, res) => {
    const downloads = displayActiveDownloads();
    res.json(downloads);
}

export default ACTIVE_DOWNLOADS;