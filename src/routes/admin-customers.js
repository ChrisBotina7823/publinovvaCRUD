const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { isLoggedIn } = require('../lib/auth');
const multer = require('multer');
const upload = multer({dest:'uploads'})
const { renameFolder, uploadFile, deleteFile, uploadMultipleFiles, createFolder, getFilesInFolder } = require('../lib/driveUpload');
const { getPayments, registerPayment, deletePayment } = require('../lib/db-payments.js');
const MAX_SIZE = 1e7;
const { formatDecimal } = require('../lib/helpers.js')

router.get('/add', (req, res) => {
    let is_credit = req.user == undefined ? true : req.user.is_credit
    const size = (MAX_SIZE / 1e6);
    res.render('customers/add', { size, is_credit });
});

router.post('/add', upload.array('files', 128), async (req, res) => {
    let { fullname, document, password, email, phone, status, credit_amount, credit_process, bank_number, available_balance } = req.body;
    try {
        if(!credit_amount) credit_amount = 0;

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
            credit_amount: formatDecimal(credit_amount),
            credit_process,
            bank_number,
            available_balance: formatDecimal(available_balance),
            user_id: req.user.id,
            storage: size,
            status
        };
    
        await pool.query('INSERT INTO customers set ?', [newCustomer]);
        req.flash('success', 'Customer Saved Successfully');
        res.redirect('/admin/customers');
    } catch(err) {
        if(err.code == 'ER_DUP_ENTRY') {
            req.flash('message', `El documento ${document} ya está registrado en el sistema`)
            res.redirect('/admin/customers/add')
        } else {
            req.flash('message', `${err}`)
            res.redirect('/admin/customers/add')
        }
    }
});

router.get('/', isLoggedIn, async (req, res) => {
    console.log(req.user.id)
    try {
        const rows = await pool.query('SELECT * FROM customers WHERE user_id = ?', [req.user.id]);
        const customers = rows[0]
        // console.log(customers)
        for (const customer of customers) {
            customer.files = await getFilesInFolder(customer.folderId);
            // console.log(customer)
            customer.photoUrl = customer.photoId ? `https://drive.google.com/uc?export=view&id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
        }
        res.render('customers/customer-list', { customers });
    } catch(err) {
        console.error(err)
    }
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM customers WHERE id = ?', [id])
        const { folderId: fileId, document, photoId } = result[0][0]
        await deleteFile(fileId)
        if(photoId != null) await deleteFile(photoId)
    
        await pool.query("DELETE FROM payments WHERE customer_id = ?", [id]) 
        await pool.query('DELETE FROM customers WHERE id = ?', [id]);
        req.flash('success', `Cliente identificado con ${document} eliminado`);
        res.redirect('/admin/customers');
    } catch(err) {
        console.log(err);
    }
});

router.get('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customers = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
        const customer = customers[0][0]
        const files = await getFilesInFolder(customer.folderId)
        // console.log(files)
        const remaining_size = (MAX_SIZE - customer.storage) / 1e6
        let is_credit = req.user == undefined ? true : req.user.is_credit
        res.render('customers/edit', {customer, remaining_size, files, is_credit});

    } catch(err) {
        if(err.code == 'ER_DUP_ENTRY') {
            req.flash('message', `El documento ${document} ya está registrado en el sistema`)
            res.redirect('/admin/customers/add')
        } else {
            req.flash('message', `${err}`)
            res.redirect('/admin/customers/add')
        }
    }
});
router.get('/updatePhoto/:id', async(req, res) => {
    try {
        const {id} = req.params
        const customers = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
        const customer = customers[0][0]
        console.log(customer)
        customer.photoUrl = customer.photoId ? `https://drive.google.com/uc?export=view&id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
        res.render('customers/updatePhoto', {customer});
    } catch(err) {
        console.error(err)
    }
})

router.post('/updatePhoto/:id/:photoId', upload.single('photo'), async(req, res) => {
    const { id, photoId } = req.params
    const picture = req.file
    const fileId = await uploadFile(picture, '1wMq4IRQBC-TA0pFdX-6_6U5kZLkjH6vr')
    try {
        await pool.query('UPDATE customers SET photoId = ? WHERE ID = ?', [fileId, id])
        if(photoId != -1) {
            console.log("PHOTO ID: ", photoId)
            const result = await deleteFile(photoId)
            console.log(result)
        }
    } catch(err) {
        console.error(err)
    }
    res.redirect('/')
})

router.post('/edit/:userId/:folderId', upload.array('files', 128), async (req, res) => {
    const { userId, folderId } = req.params;
    let { fullname, phone, email, document, password, status, credit_amount, credit_process, bank_number, available_balance} = req.body;
    const files = req.files
    const size = files.reduce( (acc, item) => acc + item.size, 0 );
    try {
        if(!credit_amount) credit_amount = 0;

        rows = await pool.query('SELECT * FROM customers WHERE id = ?', [userId])
        const customer = rows[0][0]
        const newSize = size + customer.storage
        const newCustomer = {
            fullname,
            phone,
            email,
            document,
            password,
            credit_amount: formatDecimal(credit_amount),
            credit_process,
            bank_number,
            available_balance: formatDecimal(available_balance),
            storage: newSize,
            status
        };
        await pool.query('UPDATE customers set ? WHERE id = ?', [newCustomer, userId]);
        await uploadMultipleFiles(files, folderId)
        await renameFolder(folderId, document) 
        req.flash('success', 'Cliente editado con éxito');
        res.redirect('/admin/customers');
    } catch(err) {
        console.log(err);
        req.flash('message', `Error al editar usuario`)
        res.redirect('/admin/customers')
    }
});

router.get('/files/delete/:userId/:fileId', async (req, res) => {
    const { userId, fileId} = req.params
    await deleteFile(fileId)
    res.redirect(`/admin/customers/edit/${userId}`)
})

router.get('/payments/:userId', async (req, res) => {
    // console.log(req.user)
    const userId = req.params.userId;
    const payments = await getPayments(userId);
    res.render('customers/customer-payments', {payments, userId, allowDelete:true})
})

router.post('/payments/add/:userId', async (req, res) => {
    const customer_id = req.params.userId;
    const { paid_amount, pending_amount, description, recipient, address } = req.body;
    const payment = {
        paid_amount: formatDecimal(paid_amount),
        pending_amount: formatDecimal(pending_amount),
        description,
        customer_id,
        address,
        recipient
    }
    await registerPayment(payment)
    res.redirect(`/admin/customers/payments/${customer_id}`)
})

router.get('/payments/delete/:userId/:paymentId', async (req, res) => {
    const { userId, paymentId } = req.params
    await deletePayment(paymentId);
    res.redirect(`/admin/customers/payments/${userId}`)
})

module.exports = router;