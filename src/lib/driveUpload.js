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

    module.exports = {
        uploadFile: async (file, folderId) => {
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
        },
        uploadMultipleFiles: async (files, folderId) => {
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
        },
        deleteFile: async (fileId) => {
            try {
                await drive.files.delete({ fileId })

            } catch(err) {
                console.log(err)
            }
        },
        createFolder: async(name, parentFolderId) => {
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
        },
        getFilesInFolder: async (folderId) => {
            try {
                const res = await drive.files.list({
                    q: `'${folderId}' in parents`,
                    fields: 'nextPageToken, files(id, name)',
                })
                return res.data.files
            } catch(err) {
                console.log(err)
            }
        },
        renameFolder: async (folderId, newName) => {
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
    }