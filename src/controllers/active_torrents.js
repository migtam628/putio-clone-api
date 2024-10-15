import { activeTorrents } from '../services/config.js';

const ACTIVE_TORRENTS = (req, res) => {
    res.json(activeTorrents);
}

export default ACTIVE_TORRENTS;