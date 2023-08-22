const { pool } = require('../database.js')

const getPayments = async (customer_id) => {
    let data = await pool.query(`SELECT * FROM payments WHERE customer_id = ?`, [customer_id])
    data = data[0]
    data = data.reverse()
    return data
}

const registerPayment = async(payment) => {
    await pool.query(`INSERT INTO payments SET ?`, [payment])
}

const deletePayment = async(paymentId) => {
    console.log(paymentId)
    await pool.query(`DELETE FROM payments WHERE id = ?`, [paymentId])
}

module.exports = {
    getPayments,
    registerPayment,
    deletePayment
}
