const { pool } = require('./index.js')
const { createFolder } = require('../connections/drive-api.js')
const { encryptPassword } = require('../helpers/encryption.js')
const { getElementById } = require('./general.js')
const { calculateLastPay, formatDate } = require('../helpers/formatter.js')

// SEARCH FUNCTIONS
const getSuperUserByUserId = async (user_id) => {
    const result = (await pool.query('SELECT * FROM superusers WHERE user_id = ?', [user_id]))[0]
    return (result.length) ? result[0] : null
}
const getAdminById = async (id) => {
    const result = (await pool.query('SELECT * FROM admins WHERE email = ? OR id = ?', [id, id]))[0]
    if(!result.length) return null
    let admin = result[0]
    admin.last_pay = calculateLastPay(admin.last_pay)
    admin.initial_pay = formatDate(admin.initial_pay)
    return admin
}

const getUserByInsertId = async (id) => {
    return (await getElementById('admins', id))
        || (await getElementById('customers', id))
        || (await getElementById('superusers', id))
}
const getAllAdmins = async () => {
    let admins = ( await pool.query('SELECT * FROM admins') )[0]
    const current_date = new Date()
    for (let admin of admins) {
        admin.last_pay = formatDate(admin.last_pay, /*30*24*3600*1000*/)
        admin.pending_payment = admin.last_pay < current_date
        admin.initial_pay = formatDate(admin.initial_pay)
    }
    return admins
}

// REGISTER FUNCTIONS
const registerSuperuser = async ({ user_id, password }) => {
    const newUser = {
        user_id,
        password: await encryptPassword(password),
        type: 'superuser'
    };
    const result = await pool.query('INSERT INTO superusers SET ? ', newUser);
    newUser.id = result[0].insertId
    return newUser
}
const registerAdmin = async ({ email, name, password }) => {
    const hashedPassword = await encryptPassword(password);
    const folderId = await createFolder(name, '1V_V3uSqGJELkVfyJIB10vXrE4gjV8QNO');
    let newUser = {
        email,
        password: hashedPassword,
        name,
        folderId,
        type: "admin",
    };
    const result = await pool.query('INSERT INTO admins SET ? ', newUser);
    newUser.id = result[0].insertId
    return newUser
}

// UPDATE FUNCTIONS
const updateAdminById = async (id, {email, password = null, name, last_pay}) => {
    let newAdmin = {
        email,
        name,
        initial_pay: unformatDate(last_pay)
    };
    if (password) newAdmin.password = await helpers.encryptPassword(password)
    await pool.query('UPDATE admins set ? WHERE id = ?', [newAdmin, id]);
    await pool.query('CALL update_last_pay(?)', [id])
}

const switchAdminStatus = async (id) => {
    const admin = (await pool.query('SELECT blocked FROM admins WHERE id = ?', [id]) )[0][0]
    await pool.query('UPDATE ADMINS SET blocked = ? WHERE id = ?', [!admin.blocked, id])
}


module.exports = {
    getAdminById,
    getUserByInsertId,
    getSuperUserByUserId,
    getAllAdmins,
    registerSuperuser,
    registerAdmin,
    updateAdminById,
    switchAdminStatus,
}