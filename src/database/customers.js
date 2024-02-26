const { pool } = require('./index.js')
const { createFolder, uploadMultipleFiles, renameFolder, deleteFolderAndContents, uploadFile, deleteFile } = require('../connections/drive-api.js')
const { encryptPassword } = require('../helpers/encryption.js')
const { deleteCustomerPayments } = require('./payments.js')
const { formatDecimal } = require('../helpers/formatter.js')

const getCustomerByKey = async (document, admin_id) => {
    const result = (await pool.query('SELECT * FROM customers WHERE document = ? AND user_id = ?', [document, admin_id]))[0]
    if(!result.length) return null
    let customer = result[0]
    customer.photoUrl = customer.photoId ? `https://drive.google.com/thumbnail?id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
    return customer
}

const getCustomerById = async (id) => {
    const result = (await pool.query('SELECT * FROM customers WHERE id = ?', [id]))[0]
    if(!result.length) return null
    let customer = result[0]
    customer.photoUrl = customer.photoId ? `https://drive.google.com/thumbnail?id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
    return customer
}


const getAllCustomers = async (admin_id) => {
    let customers = ( await pool.query('SELECT * FROM customers WHERE user_id = ?', [admin_id]) )[0]
    for(let customer of customers) {
        customer.photoUrl = customer.photoId ? `https://drive.google.com/thumbnail?id=${customer.photoId}` : "https://www.freeiconspng.com/uploads/user-icon-png-person-user-profile-icon-20.png"
    }
    return customers.reverse()
}

const registerCustomer = async ({fullname, document, password, email, phone, status, credit_amount = 0, credit_process, bank_number, available_balance, realization, realization_amount, credit_note}, files, adminFolderId, admin_id) => {
    const storage = files.reduce((acc, item) => acc + item.size, 0);
    files.forEach(file => file.originalname = Buffer.from(file.originalname, 'ascii').toString('utf8') )
    console.log(adminFolderId)
    const folderId = await createFolder( document, adminFolderId )
    console.log(admin_id)
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
        user_id: admin_id,
        storage,
        status,
        realization,
        credit_note,
        folderId,
        realization_amount: formatDecimal(realization_amount)
    };

    console.log(newCustomer)

    uploadMultipleFiles(files, folderId).then( () => {
        console.log("Files uploaded correctly")
    })

    const result = await pool.query('INSERT INTO customers set ?', [newCustomer]);
    newCustomer.id = result[0].insertId
    return newCustomer
}

const updateCustomer = async (id, {fullname, phone, email, document, password, status, credit_amount = 0, credit_process, bank_number, available_balance, realization, realization_amount, credit_note}, files, folderId) => {
    const additionalStorage = files.reduce((acc, item) => acc + item.size, 0);
    files.forEach(file => file.originalname = Buffer.from(file.originalname, 'ascii').toString('utf8'))
    const [ [{storage}] ] = await pool.query('SELECT storage FROM customers WHERE id = ?', [id])
    console.log(storage)
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
        storage: storage+additionalStorage,
        status,
        realization,
        credit_note,
        realization_amount: formatDecimal(realization_amount)
    };
    await pool.query('UPDATE customers set ? WHERE id = ?', [newCustomer, id]);
    uploadMultipleFiles(files, folderId).then(
        async () => {
            await renameFolder(folderId, document)
            console.log("ready")
        }
    )
}

const updateCustomerPhoto = async (id, picture, prevPicture = null) => {
    const fileId = await uploadFile(picture, '1wMq4IRQBC-TA0pFdX-6_6U5kZLkjH6vr')
    console.log(fileId)
    await pool.query('UPDATE customers SET photoId = ? WHERE ID = ?', [fileId, id])
    if(prevPicture != -1) await deleteFile(prevPicture)
}

const deleteCustomer = async (id) => {
    const [ {folderId, photoId} ] = await pool.query('SELECT folderId, photoId FROM customers WHERE id = ?', [id])
    await deleteCustomerPayments(id)
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    deleteFolderAndContents(folderId)
    .then(
        async () => {
            if (photoId != null) await deleteFile(photoId)
            console.log("files deleted correctly")
        }
    )
}

const deleteCustomerPhoto = async (id) => {
    const customer = await getCustomerById(id)
    console.log(customer.photoId)
    if(customer.photoId) await deleteFile(customer.photoId)
    await pool.query('UPDATE customers SET photoId = NULL WHERE id = ?', [id])
}

module.exports = {
    getCustomerByKey,
    getCustomerById,
    getAllCustomers,
    registerCustomer,
    deleteCustomer,
    updateCustomer,
    updateCustomerPhoto,
    deleteCustomerPhoto
}