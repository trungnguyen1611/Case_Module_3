const mysql=require('mysql');

class Database{
    constructor() {
    }
    static connect(){
        return mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'nqtrung',
            database: 'case_module_3',
            charset: 'utf8'
        })
    }
}

module.exports = Database;