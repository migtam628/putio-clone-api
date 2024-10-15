import { activeTorrents, client } from '../services/config.js';

const STOP_DOWNLOAD = (req, res) => {
    const magnetLink = req.query.magnet_link;
    try {

        if (!magnetLink) {
            return res.status(400).send('Magnet link is required.');
        }

        const torrent = client.get(magnetLink);

        if (!torrent) {
            return res.status(404).send('Torrent not found.');
        }

        console.log('Stopping download:', magnetLink);

        // Use client.remove to stop and remove the torrent
        client.remove(magnetLink, (err) => {
            if (err) {
                console.error('Error stopping download:', err);
                return res.status(500).send('Failed to stop download.');
            }

            console.log('Download stopped:', magnetLink);

            // Remove from activeTorrents array if present
            const index = activeTorrents.findIndex((torrent) => torrent.magnetLink === magnetLink);

            if (index !== -1) {
                activeTorrents.splice(index, 1);
                console.log(`Torrent removed from activeTorrents: ${magnetLink}`);
            }

            res.status(200).send('Download stopped successfully.');
        });
    } catch (error) {
        console.error('Error stopping download:', error);
        return res.status(500).json({ error: 'Failed to stop download.' });
    }
};

export default STOP_DOWNLOAD;
