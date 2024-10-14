

const form = document.getElementById('torrent-form');
const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const fileListContainer = document.getElementById('fileList');
const activeDownloads = document.getElementById('active-downloads');

loadFiles();
displayActiveDownloads();

setInterval(() => {
    displayActiveDownloads();
}, 3000);

setInterval(() => {
    loadFiles();
}, 5000);

// wait for clipboard paste to be implemented
document.addEventListener('paste', (event) => {
    const paste = (event.clipboardData || window.clipboardData).getData('text');
    document.getElementById('magnet_link').value = paste;
    form.dispatchEvent(new Event('submit'));
});

// Close modal functionality
document.getElementById('closeModal').onclick = function () {
    document.getElementById('directoryModal').style.display = 'none';
};

form.addEventListener('submit', function (event) {
    event.preventDefault();
    const magnetLink = document.getElementById('magnet_link').value;

    fetch('/upload-torrent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ magnet_link: magnetLink }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.fileName) {
                const videoUrl = `/videos/${data.fileName}`;
                document.getElementById('videoSource').src = videoUrl;
                videoPlayer.load();
                videoPlayer.play();
            } else {
                alert("No .mp4 file found in the torrent.");
            }
        })
        .catch(error => {
            alert('An error occurred while downloading the torrent.');
        });
});

function stopAllDownloads() {
    fetch('/stop-all-downloads')
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            alert('An error occurred while stopping all downloads.');
        });
}

function stopDownload(magnetLink) {
    fetch(`/stop-download?magnetLink=${encodeURIComponent(magnetLink)}`)
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            console.log(data);
        })
        .catch(error => {
            alert('An error occurred while stopping the download.');
            console.log(error);
        });
}

function displayActiveDownloads() {
    fetch('/active-downloads')
        .then(response => response.json())
        .then(downloads => {
            activeDownloads.innerHTML = ''; // Clear previous downloads

            // Update the active torrents badge
            const badge = document.getElementById('active-torrents-badge');
            if (downloads.length > 0) {
                badge.textContent = downloads.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }

            if (downloads.length === 0) {
                activeDownloads.innerHTML = '<h6 class="text-gray-500">No active downloads.</h6>';
                return;
            }
            downloads.forEach(download => {
                const downloadItem = document.createElement('div');
                downloadItem.classList.add(
                    'bg-white',
                    'border',
                    'border-gray-300',
                    'rounded-lg',
                    'p-4',
                    'shadow-md',
                    'hover:shadow-lg',
                    'transition',
                    'duration-300',
                    'flex',
                    'flex-col',
                    'justify-between'
                );

                downloadItem.innerHTML = `
                            <div>
                                <h5 class="font-bold text-lg text-blue-600 mb-2">
                                    <b>${download.progress}%</b> - ${download.name}
                                </h5>
                                <div class="text-gray-500 text-sm">
                                    <p>Speed: ${(download.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s</p>
                                    <p>Total: ${(download.downloaded / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div class="mt-2">
                                    <div class="bg-gray-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${download.progress}%;"></div>
                                    </div>
                                </div>
                                <div class="mt-2 text-sm text-gray-500">
                                    ${download.status === 'completed' ? '✅ Completed' : download.status === 'failed' ? '❌ Failed' : '⬇️ Downloading'}
                                </div>
                            </div>
                            <div class="mt-4 flex justify-end">
                                <button class="bg-red-500 text-white rounded-md px-3 py-1 text-sm hover:bg-red-600 transition duration-200" onclick="stopDownload('${download.magnetLink}')">Cancel</button>
                            </div>
                        `;

                activeDownloads.appendChild(downloadItem);
            });
        })
        .catch(error => {
            activeDownloads.innerHTML = '<h6 class="text-red-500">Error fetching active downloads</h6>';
        });
}

function loadFiles() {
    fetch('/list-files')
        .then(response => response.json())
        .then(items => {
            fileListContainer.innerHTML = ''; // Clear existing list
            items.forEach(item => {
                const fileItem = document.createElement('div');
                fileItem.classList.add(
                    'bg-white',
                    'border',
                    'border-gray-300',
                    'rounded-lg',
                    'p-4',
                    'shadow-md',
                    'hover:shadow-lg',
                    'transition',
                    'duration-300',
                    'flex',
                    'flex-col',
                    'justify-between'
                );

                if (item.isDirectory) {
                    // It's a directory, set it up as a clickable folder
                    fileItem.innerHTML = `
                                <div>
                                    <h4 class="text-green-600 font-semibold cursor-pointer" onclick="loadDirectory('${item.name}')">📁 ${item.name}</h4>
                                </div>
                                <div class="mt-4 flex justify-end">
                                    <button onclick="deleteDirectory('${item.name}')"
                                        class="bg-red-500 text-white p-1 rounded-lg hover:bg-red-400 transition duration-200">Delete Directory</button>
                                </div>
                            `;
                } else {
                    // It's a file
                    fileItem.innerHTML = `
                                <div>
                                    <h4 class="text-blue-600 font-semibold cursor-pointer" onclick="playVideo('videos/${item.name}')">🎬 ${item.name}</h4>
                                </div>
                                <div class="mt-4 flex justify-end">
                                    <button onclick="deleteFile('${item.name}')"
                                        class="bg-red-500 text-white p-1 rounded-lg hover:bg-red-400 transition duration-200">Delete File</button>
                                </div>
                            `;
                }

                fileListContainer.appendChild(fileItem);
            });
        })
        .catch(error => console.error('Error loading files:', error));
}

function playVideo(src) {
    videoSource.src = src;
    videoPlayer.load();
    videoPlayer.play();
}

// Function to delete a specific file
function deleteFile(fileName) {
    fetch(`/delete-file/${fileName}`, {
        method: 'DELETE',
    })
        .then(response => response.text())
        .then(data => {
            alert(data);
            loadFiles(); // Refresh file list after deletion
        })
        .catch(error => {
            alert('An error occurred while deleting the file.');
        });
}

// Function to delete a directory
function deleteDirectory(directoryName) {
    fetch(`/delete-directory?name=${encodeURIComponent(directoryName)}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadFiles(); // Reload file list
        })
        .catch(error => {
            console.error('Error deleting directory:', error);
            alert('An error occurred while deleting the directory.');
        });
}

// Recursive delete of all files
function deleteAllFiles() {
    fetch('/delete-all-files', {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadFiles(); // Reload file list
        })
        .catch(error => {
            console.error('Error deleting all files:', error);
            alert('An error occurred while deleting all files.');
        });
}

// Function to fetch directory contents (if needed)
function loadDirectory(directoryName) {
    fetch(`/list-files?dir=${encodeURIComponent(directoryName)}`)
        .then(response => response.json())
        .then(data => {
            const directoryContents = document.getElementById('directoryContents');
            directoryContents.innerHTML = ''; // Clear previous contents

            // Update the modal title
            document.getElementById('directoryTitle').textContent = `Contents of ${directoryName}`;

            data.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item.name + (item.isDirectory ? ' (Folder)' : ' (File)');

                // If it's a directory, add click event to view its contents
                if (item.isDirectory) {
                    listItem.onclick = () => loadDirectory(item.name);
                    listItem.style.cursor = 'pointer';
                    listItem.style.color = 'blue'; // Optional: style for folders
                }
                directoryContents.appendChild(listItem);
            });

            // Display the modal
            document.getElementById('directoryModal').style.display = 'block';
        })
        .catch(error => console.error('Error fetching directory contents:', error));
}