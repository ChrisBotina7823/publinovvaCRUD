module.exports = {

    database: {
        connectionLimit: 10,
        host: process.env.DB_HOST, // || "localhost",
        user: process.env.DB_USER, // || "root",
        password: process.env.DB_PASSWORD, //  || "Piececontrol7823#",
        database: process.env.DB_DATABASE // || "db_links"
    },

    drive: {
        clientId: "781222722587-s8gf5urbdf5g2udef9fmvr96qg4cba88.apps.googleusercontent.com",
        clientSecret: "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"
    }

};