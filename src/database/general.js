const { pool } = require('./index.js')

const getElementById = async (table, id) => {
    const result = ( await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]) )
    return result.length ? result[0] : null
}

module.exports = {
    getElementById
}