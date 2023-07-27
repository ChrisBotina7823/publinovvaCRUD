const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const multer = require('multer');
const upload = multer({dest:'uploads'})
const { renameFolder, uploadFile, deleteFile, uploadMultipleFiles, createFolder, getFilesInFolder } = require('../lib/driveUpload')
const MAX_SIZE = 1e7;

router.get('/add', (req, res) => {
    const size = (MAX_SIZE / 1e6);
    res.render('customers/add', { size });
});

router.post('/add', upload.array('files', 128), async (req, res) => {
    try {
        const { fullname, document, password, email, phone, } = req.body;
        const files = req.files
        const size = files.reduce( (acc, item) => acc + item.size, 0 );
        // if(size > MAX_SIZE ) {
        //     req.flash('message', `The maximum size for a user is ${MAX_SIZE/1e6} MB`);
        //     res.redirect('/admin/customers/add');
        // }
        const folderId = await createFolder(document, req.user.folderId)
        await uploadMultipleFiles(files, folderId)
    
        const newCustomer = {
            fullname,
            folderId,
            phone,
            email,
            document,
            password,
            user_id: req.user.id,
            storage: size
        };
    
        await pool.query('INSERT INTO customers set ?', [newCustomer]);
        req.flash('success', 'Customer Saved Successfully');
        res.redirect('/admin/customers');
    } catch(err) {
        if(err.code == 'ER_DUP_ENTRY') {
            req.flash('message', 'Customer document must be unique')
            res.redirect('/admin/customers/add')
        } else {
            req.flash('message', `${err}`)
            res.redirect('/admin/customers/add')
        }
    }
});

router.get('/', isLoggedIn, async (req, res) => {
    const customers = await pool.query('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
    for (const customer of customers) {
        customer.files = await getFilesInFolder(customer.folderId);
    }
    res.render('customers/customer-list', { customers });
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM customers WHERE id = ?', [id])
    const { folderId: fileId } = result[0]
    await deleteFile(fileId)

    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    req.flash('success', 'Link Removed Successfully');
    res.redirect('/admin/customers');
});

router.get('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customers = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
        const customer = customers[0]
        const files = await getFilesInFolder(customer.folderId)
        console.log(files)
        const remaining_size = (MAX_SIZE - customer.storage) / 1e6
        res.render('customers/edit', {customer, remaining_size, files});

    } catch(err) {
        if(err.code == 'ER_DUP_ENTRY') {
            req.flash('message', 'Customer document must be unique')
            res.redirect('/admin/customers/add')
        } else {
            req.flash('message', `${err}`)
            res.redirect('/admin/customers/add')
        }
    }
});

router.post('/edit/:userId/:folderId', upload.array('files', 128), async (req, res) => {
    const { userId, folderId } = req.params;
    const { fullname, phone, email, document, password, status} = req.body;
    const files = req.files
    const size = files.reduce( (acc, item) => acc + item.size, 0 );
    const rows = await pool.query('SELECT * FROM customers WHERE id = ?', [userId])
    const customer = rows[0] 
    const newSize = size + customer.storage
    await uploadMultipleFiles(files, folderId)
    await renameFolder(folderId, document) 
    const newCustomer = {
        fullname,
        phone,
        email,
        document,
        password,
        storage: newSize,
        status
    };
    await pool.query('UPDATE customers set ? WHERE id = ?', [newCustomer, userId]);
    req.flash('success', 'Customer Updated Successfully');
    res.redirect('/admin/customers');
});

router.get('/files/delete/:userId/:fileId', async (req, res) => {
    const { userId, fileId} = req.params
    await deleteFile(fileId)
    res.redirect(`/admin/customers/edit/${userId}`)
})

module.exports = router;