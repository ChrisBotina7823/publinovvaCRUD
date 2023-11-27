    const { google } = require('googleapis')
    const fs = require('fs')
    const path = require('path')

    const scopes = ['https://www.googleapis.com/auth/drive']

    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, './drive-credentials.json'),
        scopes: scopes
    })

    const drive = google.drive({
        version: 'v3',
        auth
    })

    const uploadFile = async (file, folderId) => {
        try {
            const response = await drive.files.create({
                requestBody: {
                    name: file.originalname,
                    mimeType: file.mimeType,
                    parents: [folderId]
                },
                media: {
                    mimeType: file.mimeType,
                    body: fs.createReadStream(file.path)
                }
            });
            const fileId = response.data.id;
            return fileId;
        } catch(err) {
            console.log(err);
        }
    }
    const uploadMultipleFiles = async (files, folderId) => {
        try {
            for(const file of files) {
                await drive.files.create({
                    requestBody: {
                        name: file.originalname,
                        mimeType: file.mimeType,
                        parents: [folderId]
                    },
                    media: {
                        mimeType: file.mimeType,
                        body: fs.createReadStream(file.path)
                    }
                });
            }
        } catch(err) {
            console.log(err);
        }
    }
    const deleteFile = async (fileId) => {
        try {
            return await drive.files.delete({ fileId })

        } catch(err) {
            console.log(err)
        }
    }
    const createFolder = async(name, parentFolderId) => {
        try {
            const res = await drive.files.create({
                resource: {
                    name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId]
                },
                fields: 'id'
            })
            return res.data.id;
        } catch(err) { 
            console.log(err)
        }
    }
    const getFilesInFolder = async (folderId) => {
        try {
            const res = await drive.files.list({
                q: `'${folderId}' in parents`,
                fields: 'nextPageToken, files(id, name)',
            })
            return res.data.files
        } catch(err) {
            console.log(err)
        }
    }
    const renameFolder = async (folderId, newName) => {
        try {
            await drive.files.update({
                fileId: folderId,
                resource: {
                    name: newName
                }
            });
        } catch(err) {
            console.log(err)
        }
    }

    const deleteFolderAndContents = async (folderId) => {
        try {
            // Get the list of files and subfolders in the folder
            const filesInFolder = await getFilesInFolder(folderId);
    
            // Delete each file and subfolder
            await Promise.all(filesInFolder.map(async (file) => {
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    // Recursively delete subfolders
                    await deleteFolderAndContents(file.id);
                } else {
                    // Delete individual file
                    await deleteFile(file.id);
                }
            }));
    
            // After deleting all contents, delete the folder itself
            await deleteFile(folderId);
        } catch (err) {
            console.error(err);
        }
    };
    

    module.exports = {
        uploadFile,
        uploadMultipleFiles,
        createFolder,
        deleteFile,
        getFilesInFolder,
        renameFolder,
        deleteFolderAndContents
    }