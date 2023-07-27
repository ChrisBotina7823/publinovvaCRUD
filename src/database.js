const mysql = require('mysql');
const { promisify }= require('util');

const { database } = require('./keys');

const pool = mysql.createPool(database);

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has to many connections');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused');
    }
  }

  if (connection) connection.release();
  console.log('DB is Connected');

  return;
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) {
    // Manejar el error de conexión aquí
    console.error('Error al conectarse a la base de datos:', error);
  } else {
    console.log('Conexión a la base de datos establecida correctamente');
    console.log('El resultado de la consulta es:', results[0].solution);
  }
});

// Promisify Pool Querys
pool.query = promisify(pool.query);

module.exports = pool;
