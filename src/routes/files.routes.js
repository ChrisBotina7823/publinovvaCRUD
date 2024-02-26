const express = require('express');
const router = express.Router();
const { pool } = require('../database/index.js');
const { isLoggedIn } = require('../middlewares/auth-md.js');
const multer = require('multer');
const { uploadFile, deleteFile, getFilesInFolder } = require('../connections/drive-api.js');
const { getCustomerById, updateCustomerPhoto, deleteCustomerPhoto } = require('../database/customers.js');
const upload = multer({dest:'uploads'})


router.get('/:userId', isLoggedIn, async (req, res) => {
    try {
        const { userId } = req.params
        const customer = await getCustomerById(userId)
        if(req.user.id != userId && customer?.user_id != req.user.id) {
            res.redirect("/logout")
            return
        }
        customer.files = await getFilesInFolder(customer.folderId)
        res.render('files-view/customer-uploads', {customer, userId})
    } catch(err) {
        console.error(err)
        res.redirect('/customers')
    }
})

router.get('/profile-picture/edit-form/:id', isLoggedIn, async(req, res) => {
    try {
        const customer = await getCustomerById(req.params.id)
        if(customer?.user_id != req.user.id) {
            res.redirect("/logout")
            return
        }
        res.render('files-view/update-photo', {customer});
    } catch(err) {
        console.error(err)
        res.redirect('/customers')
    }
})

router.post('/profile-picture/:id/:prevPicture', upload.single('photo'), async(req, res) => {
    try {
        await updateCustomerPhoto(req.params.id, req.file, req.params.prevPicture)
    } catch(err) {
        console.error(err)
    }
    res.redirect('/customers')
})

router.get('/profile-picture/delete/:id', async (req, res) => {
    await deleteCustomerPhoto(req.params.id)
    res.redirect('/customers/')
})

router.get('/delete/:fileId', async (req, res) => {
    await deleteFile(req.params.fileId)
    res.status(200).json({message:"File deleted successfully"})
})

module.exports = router;