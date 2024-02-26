const express = require('express');
const router = express.Router();
const { renameFolder, uploadFile, deleteFile, uploadMultipleFiles, createFolder, getFilesInFolder, deleteFolderAndContents } = require('../connections/drive-api.js');
const MAX_SIZE = 1e7;
const { formatDecimal, formatDate } = require('../helpers/formatter.js');
const { isLoggedIn } = require('../middlewares/auth-md.js');
const multer = require('multer');
const { getAllCustomers, getCustomerByKey, registerCustomer, deleteCustomer, getCustomerById, updateCustomer } = require('../database/customers.js');
const upload = multer({ dest: 'uploads' })
const CryptoJS = require("crypto-js");
const { getPayments } = require('../database/payments.js');

router.get('/', isLoggedIn, async (req, res) => {
    try {
        console.log(req.user)
        const customers = await getAllCustomers(req.user.id)
        res.render('customers-view/customer-list', { customers });
    } catch (err) {
        console.error(err)
    }
});

router.get('/dashboard/:cypheredDoc/:admin_id', async (req, res) => {
    try {
        // Decypher url
        const cypheredDoc = decodeURIComponent(req.params.cypheredDoc);
        const doc = CryptoJS.AES.decrypt(cypheredDoc.toString(), process.env.CYPHER_KEY).toString(CryptoJS.enc.Utf8);
        // Get customer and extra information
        const customer = await getCustomerByKey(doc, req.params.admin_id)
        customer.files = await getFilesInFolder(customer.folderId);
        customer.payments = await getPayments(customer.id)        
        res.render('customers-view/dashboard', { customer, customerNav: true, customerTitle:"Inicio", showProfile: true, cypheredDoc:encodeURIComponent(cypheredDoc) });
    } catch (err) {
        console.log(err)
        res.redirect("/logout")
    }
})

router.get('/payments/:cypheredDoc/:admin_id', async (req, res) => {
    try {
        // Decypher url
        const cypheredDoc = decodeURIComponent(req.params.cypheredDoc);
        const doc = CryptoJS.AES.decrypt(cypheredDoc.toString(), process.env.CYPHER_KEY).toString(CryptoJS.enc.Utf8);
        // Get customer and extra information
        const customer = await getCustomerByKey(doc, req.params.admin_id)
        customer.payments = await getPayments(customer.id)        
        res.render('customers-view/payments', { customer, customerNav: true, customerTitle:"Pagos", cypheredDoc:encodeURIComponent(cypheredDoc) });
    } catch (err) {
        console.log(err)
        res.redirect("/logout")
    }
})

router.get('/files/:cypheredDoc/:admin_id', async (req, res) => {
    try {
        // Decypher url
        const cypheredDoc = decodeURIComponent(req.params.cypheredDoc);
        const doc = CryptoJS.AES.decrypt(cypheredDoc.toString(), process.env.CYPHER_KEY).toString(CryptoJS.enc.Utf8);
        // Get customer and extra information
        const customer = await getCustomerByKey(doc, req.params.admin_id)
        customer.files = await getFilesInFolder(customer.folderId)
        res.render('files-view/customer-uploads', {customer, customerNav: true, customerTitle:"Archivos Subidos", cypheredDoc:encodeURIComponent(cypheredDoc)})
    } catch(err) {
        console.error(err)
        res.redirect('/customers')
    }
})

router.get('/profile/:cypheredDoc/:admin_id', async (req, res) => {
    try {
        // Decypher url
        const cypheredDoc = decodeURIComponent(req.params.cypheredDoc);
        const doc = CryptoJS.AES.decrypt(cypheredDoc.toString(), process.env.CYPHER_KEY).toString(CryptoJS.enc.Utf8);
        // Get customer and extra information
        const customer = await getCustomerByKey(doc, req.params.admin_id)
        res.render('customers-view/profile', {customer, customerNav: true, customerTitle:"Perfil", cypheredDoc:encodeURIComponent(cypheredDoc)})
    } catch(err) {
        console.error(err)
        res.redirect('/customers')
    }
})


router.get('/add-form', isLoggedIn, (req, res) => {
    const size = (MAX_SIZE / 1e6);
    res.render('customers-view/add-form', { size });
});

router.post('/', upload.array('files', 128), async (req, res) => {
    try {
        await registerCustomer(req.body, req.files, req.user.folderId, req.user.id)
        req.flash('success', 'Usuario registrado correctamente, los archivos estarán listos en unos segundos');
        res.redirect('/customers');
    } catch (err) {
        console.error(err)
        req.flash('message', `El documento ${req.body.document} ya está registrado en el sistema`)
        res.redirect('/customers/add-form')
    }
});

router.get('/edit-form/:id', isLoggedIn, async (req, res) => {
    try {
        const customer = await getCustomerById(req.params.id)
        customer.files = await getFilesInFolder(customer.folderId)
        customer.remaining_size = (MAX_SIZE - customer.storage) / 1e6
        res.render('customers-view/edit-form', { customer });
    } catch (err) {
        console.error(err)
        req.flash('message', `El documento ${document} ya está registrado en el sistema`)
        res.redirect('/customers')
    }
});

router.post('/edit/:userId/:folderId', upload.array('files', 128), async (req, res) => {
    try {
        await updateCustomer(req.params.userId, req.body, req.files, req.params.folderId)
        req.flash('success', 'Cliente editado con éxito. Los archivos estarán listos en unos segundos');
    } catch (err) {
        console.log(err);
        req.flash('message', `Error al editar usuario`)
    }
    res.redirect('/customers');
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteCustomer(id); 
        res.status(200).json({ message: "Customer deleted successfully" })
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;