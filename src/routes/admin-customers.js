const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { isLoggedIn } = require('../lib/auth');
const multer = require('multer');
const upload = multer({dest:'uploads'})

const { renameFolder, uploadFile, deleteFile, uploadMultipleFiles, createFolder, getFilesInFolder, deleteFolderAndContents } = require('../lib/driveUpload');
const { getPayments, registerPayment, deletePayment } = require('../lib/db-payments.js');
const MAX_SIZE = 1e7;
const { formatDecimal, formatDate } = require('../lib/helpers.js');
const { file } = require('googleapis/build/src/apis/file/index.js');

router.get('/add', isLoggedIn, (req, res) => {
    let is_credit = req.user == undefined ? true : req.user.is_credit
    const size = (MAX_SIZE / 1e6);
    res.render('customers/add', { size, is_credit });
});

router.post('/add', upload.array('files', 128), async (req, res) => {
    let { fullname, document, password, email, phone, status, credit_amount, credit_process, bank_number, available_balance, realization, realization_amount, credit_note } = req.body;
    try {
        if(!credit_amount) credit_amount = 0;

        const files = req.files
        const size = files.reduce( (acc, item) => acc + item.size, 0 );
        files.forEach( file => file.originalname = Buffer.from(file.originalname, 'ascii').toString('utf8'))
        // if(size > MAX_SIZE ) {
        //     req.flash('message', `The maximum size for a user is ${MAX_SIZE/1e6} MB`);
        //     res.redirect('/admin/customers/add');
        // }
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
            user_id: req.user.id,
            storage: size,
            status,
            realization,
            credit_note,
            realization_amount: formatDecimal(realization_amount),
            type: "customer"
        };
        const [ {insertId} ] = await pool.query('INSERT INTO customers set ?', [newCustomer]);

        createFolder(document, req.user.folderId)
            .then( async folderId => {
                await pool.query('UPDATE customers set folderId = ? where id = ?', [folderId, insertId])
                await uploadMultipleFiles(files, folderId)
                console.log("Files updated correctly")
            } )
    
        console.log("amount " + realization_amount)

        req.flash('success', 'Usuario registrado correctamente, los archivos estarán listos en unos segundos');
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
        const customers = rows[0].reverse()
        for(let customer of customers) {
            customer.photoUrl = customer.photoId ? `https://drive.google.com/thumbnail?id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
        }
        req.user.last_pay = formatDate(req.user.last_pay, /*30*24*3600*1000*/)
        let curr_date = new Date()
        req.user.pending_amount = req.user.last_pay < curr_date
        
        res.render('customers/customer-list', { customers });
    } catch(err) {
        console.error(err)
    }
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM customers WHERE id = ?', [id])
        const { folderId: fileId, document, photoId } = result[0][0]   
        console.log(fileId)

        await pool.query("DELETE FROM payments WHERE customer_id = ?", [id])
        await pool.query('DELETE FROM customers WHERE id = ?', [id]);
        
        deleteFolderAndContents(fileId)
        .then(
                async () => {
                    if(photoId != null) await deleteFile(photoId)
                    console.log("files deleted correctly")
                }
            )
        res.status(200).json({message:"Customer deleted successfully"})
    } catch(err) {
        console.log(err);
    }
});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
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
router.get('/updatePhoto/:id', isLoggedIn, async(req, res) => {
    try {
        const {id} = req.params
        const customers = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
        const customer = customers[0][0]
        if(customer?.user_id != req.user.id) {
            res.redirect("/logout")
            return
        }
        console.log(customer)
        customer.photoUrl = customer.photoId ? `https://drive.google.com/thumbnail?id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
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
        pool.query('UPDATE customers SET photoId = ? WHERE ID = ?', [fileId, id])
            .then( async () => {
                if(photoId != -1) {
                    const result = await deleteFile(photoId)
                    console.log("previous photo deleted successfully")
                }
            } )
    } catch(err) {
        console.error(err)
    }
    res.redirect('/')
})

router.post('/edit/:userId/:folderId', upload.array('files', 128), async (req, res) => {
    const { userId, folderId } = req.params;
    let { fullname, phone, email, document, password, status, credit_amount, credit_process, bank_number, available_balance, realization, realization_amount, credit_note} = req.body;
    const files = req.files
    const size = files.reduce( (acc, item) => acc + item.size, 0 );
    files.forEach( file => file.originalname = Buffer.from(file.originalname, 'ascii').toString('utf8'))
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
            status,
            realization,
            credit_note,
            realization_amount: formatDecimal(realization_amount),
            type:"customer"
        };
        await pool.query('UPDATE customers set ? WHERE id = ?', [newCustomer, userId]);

        uploadMultipleFiles(files, folderId)
            .then(
                async () => {
                    await renameFolder(folderId, document) 
                    console.log("Folder updated successfully")
                }
            )
        req.flash('success', 'Cliente editado con éxito. Los archivos estarán listos en unos segundos');
        res.redirect('/admin/customers');
    } catch(err) {
        console.log(err);
        req.flash('message', `Error al editar usuario`)
        res.redirect('/admin/customers')
    }
});

router.delete('/files/delete/:fileId', async (req, res) => {
    const {fileId} = req.params
    await deleteFile(fileId)
    res.status(200).json({message:"File deleted successfully"})
})

router.get('/payments/:userId', isLoggedIn, async (req, res) => {
    // console.log(req.user)
    const userId = req.params.userId;
    const result = await pool.query('SELECT * FROM customers WHERE id = ?', [userId])
    let customer = result[0][0]
    if(req.user.id != userId && customer?.user_id != req.user.id) {
        res.redirect("/logout")
        return
    }
    const payments = await getPayments(userId);
    res.render('customers/customer-payments', {payments, userId, allowDelete:true})
})

router.get('/uploads/:userId', isLoggedIn, async (req, res) => {
    const { userId } = req.params
    const result = await pool.query('SELECT * FROM customers WHERE id = ?', [userId])
    let customer = result[0][0]
    if(req.user.id != userId && customer?.user_id != req.user.id) {
        res.redirect("/logout")
        return
    }
    customer.files = await getFilesInFolder(customer.folderId)
    res.render('customers/customer-uploads', {customer, userId})
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

router.delete('/payments/delete/:paymentId', async (req, res) => {
    const { paymentId } = req.params
    await deletePayment(paymentId);
    res.status(200).json({message:"Payment deleted successfully"})
})

module.exports = router;