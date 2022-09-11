let Database = require('./database');

class Model {
    constructor() {
        this.connect = Database.connect(err => {
            if (err) console.log(err);
            else console.log('connect success');
        })
    }

    checkAccount(email, password) {
        return new Promise((resolve, reject) => {
            let sql = `select * from account where (account.email = '${email}' and account.password = '${password}')`;
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            })
        })
    }

    addDrinkDB(type_drink, name_drink, price) {
        return new Promise((resolve, reject) => {
            let sql = `insert into list_drink(type,name,price) values ('${type_drink}','${name_drink}',${price});`
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    deleteDrinkDB(id) {
        return new Promise((resolve, reject) => {
            let sql = `delete from list_drink where list_drink.id = ${id};`
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    getListDrinkDB() {
        return new Promise((resolve, reject) => {
            let sql = `select * from list_drink`
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    editDrinkDB(id, type, name, price) {
        return new Promise((resolve, reject) => {
            let sql = `update list_drink 
                     set list_drink.type = '${type}', list_drink.name = '${name}', list_drink.price=${price}
                     where list_drink.id=${id}`
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    searchDB(name) {
        return new Promise((resolve, reject) => {
            let sql = `select type,name,price from list_drink where (list_drink.name='${name}' or list_drink.type='${name}' or concat(list_drink.type,' ',list_drink.name)='${name}')`;
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    getListTempDB() {
        return new Promise((resolve, reject) => {
            let sql = `select * from temp`;
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data)
            })
        })
    }

    insertTempDB(name, price, amount) {
        return new Promise((resolve, reject) => {
            let sql = `insert into temp(name_drink,price,amount) 
                     values ('${name}',${price},${amount})`;
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    deleteTempDB(id) {
        return new Promise((resolve, reject) => {
            let sql = `delete from temp where temp.id = ${id}`
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    deleteTempTableDB() {
        return new Promise((resolve, reject) => {
            let sql = `delete from temp where temp.id != 0`;
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    getSumTemp(){
        return new Promise((resolve, reject) => {
            let sql=`select SUM(price) as total from temp`;
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    getSumBillDB(id_bill){
        return new Promise((resolve, reject) => {
            let sql=`select SUM(price) as total from bill where bill.id_bill = ${id_bill}`
            this.connect.query(sql, (err, data) => {
                if(err) reject(err);
                resolve(data);
            })
        })
    }

    insertBillDB(id_bill,name_drink,price,amount){
        return new Promise((resolve, reject)=>{
            let sql=`insert into bill(id_bill,name_drink,price,amount)
                    values(${id_bill},'${name_drink}',${price},${amount})`;
            this.connect.query(sql,(err,data)=>{
                if(err) reject(err);
                resolve(data);
            })
        })
    }

    insertListBillDB(id_bill,total){
        return new Promise((resolve, reject) => {
            let sql=`insert into list_bill(id_bill,total)
                    values (${id_bill},${total})`
            this.connect.query(sql,(err,data)=>{
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    getListBillDB(){
        return new Promise((resolve, reject) => {
            let sql=`select * from list_bill order by list_bill.id_bill desc`
            this.connect.query(sql, (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    getBillDB(id_bill){
        return new Promise((resolve, reject) => {
            let sql=`select id_bill,name_drink,price,amount from bill
                    where bill.id_bill=${id_bill}`
            this.connect.query(sql, (err, data) => {
                if(err) reject(err);
                resolve(data);
            })
        })
    }

}

module.exports = Model;