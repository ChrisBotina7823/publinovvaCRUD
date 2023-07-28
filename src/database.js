// const mysql = require('mysql');
// const { promisify } = require('util');

// const { database } = require('./keys');

// const pool = mysql.createPool(database);

// pool.getConnection((err, connection) => {
//   if (err) {
//     console.error(err)
//   }

//   if (connection) {
//     connection.release();
//     console.log('DB is Connected');
//   }
//   return;
// });

// // Promisify Pool Querys
// pool.query = promisify(pool.query);

// module.exports = pool;


const {createPool} = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config()

module.exports = {
    pool: createPool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    })
}


// const mysql = require('mysql')
// const { database } = require('./keys')
// const connection = mysql.createConnection(database)
// module.exports = connection;



// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://publinovva:Publinovva123@publinovvadb.6qrmmho.mongodb.net/?retryWrites=true&w=majority";
// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function connect() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     return client;
//   } catch(err) {
//     console.error(err)
//   }
// }

// module.exports = { connect }

