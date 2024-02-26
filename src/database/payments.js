const { formatDecimal } = require('../helpers/formatter.js')
const { pool } = require('./index.js')

const getPayments = async (customer_id) => {
    let payments = await pool.query(`SELECT * FROM payments WHERE customer_id = ?`, [customer_id])
    payments = payments[0].reverse()
    return payments
}

const getAdminPayments = async (admin_id, initial_pay) => {
    let payments = await pool.query(`SELECT * FROM admin_payments WHERE admin_id = ?`, [admin_id])
    for(let i = 0; i<payments.length; i++) {
        payments[i].oportune_date = formatDate(initial_pay,i*30*24*60*60*1000)
        payments[i].oportune = payments[i].payment_date < payments[i].oportune_date
        payments[i].offset = Math.round( Math.abs( payments[i].oportune_date.getTime() - payments[i].payment_date.getTime() ) / (1000*60*60*24) ) 
      }
    payments = payments[0].reverse()
    return payments
}

const registerPayment = async({paid_amount, pending_amount, description, recipient, address}, customer_id) => {
    const payment = {
        paid_amount: formatDecimal(paid_amount),
        pending_amount: formatDecimal(pending_amount),
        description,
        customer_id,
        address,
        recipient
    }
    await pool.query(`INSERT INTO payments SET ?`, [payment])
}

const deletePayment = async (paymentId) => {
    await pool.query(`DELETE FROM payments WHERE id = ?`, [paymentId])
}

const deleteCustomerPayments = async(customerId) => {
    pool.query("DELETE FROM payments WHERE customer_id = ?", [customerId])
}

const makeAdminPayment = async (admin_id, option) => {
    if (option == 1) {
        await pool.query('INSERT INTO admin_payments(admin_id) VALUES (?)', [admin_id]);
    } else {
        await pool.query('DELETE FROM admin_payments WHERE admin_id = ? ORDER BY id DESC LIMIT 1', [admin_id]);
    }
    await pool.query('CALL update_last_pay(?)', [admin_id]);
}

module.exports = {
    getPayments,
    registerPayment,
    deletePayment,
    deleteCustomerPayments,
    getAdminPayments,
    makeAdminPayment
}
