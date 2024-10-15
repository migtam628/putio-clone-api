const HOME = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Vary', 'Accept-Encoding');

    res.sendFile(resolve(__dirname, 'dist/index.html'));
}

export default HOME;