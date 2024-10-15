const DELETE_ALL_DIRECTORIES = (req, res) => {
    const videosDir = VIDEO_PATH;

    deleteFolderRecursive(videosDir); // Delete everything recursively

    fs.mkdirSync(videosDir); // Recreate the root folder

    res.json({ message: 'All files deleted.' });
};

export default DELETE_ALL_DIRECTORIES;