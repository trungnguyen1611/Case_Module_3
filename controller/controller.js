
const fs = require('fs');
const qs = require('qs');
const cookie = require('cookie');
const Model = require('../model/model');
// import Model from '../model/model'
class Controller {
    constructor() {
        this.status = true;
        this.model = new Model();
    }

    readPage(pathname) {
        return new Promise((resolve, reject) => {
            fs.readFile(pathname, 'utf-8', (err, data) => {
                if (err) reject(err);
                resolve(data);
            })
        })
    }

    logOut(req) {
        return new Promise((resolve, reject) => {
            let cookieReq = cookie.parse(req.headers.cookie)
            let cookieData = JSON.parse(cookieReq.cookieLogin)
            fs.unlink(`./session/${cookieData.session_id}`, (err) => {
                if (err) {
                    reject(err);
                }
                resolve()
            })
        })
    }

    login(req, res) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            })
            req.on('end', () => {
                let dataForm = qs.parse(data);
                this.model.checkAccount(dataForm.email, dataForm.password).then(result => {
                    if (result[0]) {
                        let sessionLogin = {
                            id: `${Date.now()}`,
                            data_account: result[0]
                        };

                        let cookieLogin = {
                            session_id: `${sessionLogin.id}`,
                            userEmail: `${result[0].email}`
                        }
                        let cookieRemember = {
                            session_id: `${sessionLogin.id}`,
                            user: {
                                email: `${result[0].email}`,
                                password: `${result[0].password}`
                            }
                        }
                        fs.writeFile(`./session/${sessionLogin.id}`, JSON.stringify(sessionLogin), err => {
                            if (err) console.log(err.message);
                        })
                        if (dataForm.remember === 'on') {
                            res.setHeader('Set-Cookie', cookie.serialize('cookieLogin', JSON.stringify(cookieRemember)))
                        } else {
                            res.setHeader('Set-Cookie', cookie.serialize('cookieLogin', JSON.stringify(cookieLogin)))
                        }
                        res.writeHead(301, {location: '/home'})
                        res.end()
                        resolve({
                            session: `${sessionLogin.id}`,
                            cookie: `${cookieLogin.session_id}`
                        })
                    } else {
                        res.writeHead(301, {location: '/'})
                        res.end();
                        resolve();
                    }
                })
            })
        })
    }

    checkSessionId(req, res) {
        return new Promise(function (resolve, reject) {
            let cookieReq = cookie.parse(req.headers.cookie)
            let cookieData = JSON.parse(cookieReq.cookieLogin)
            fs.readFile(`./session/${cookieData.session_id}`, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve()
            })
        })
    }

    addDrinkManager(req, res) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            })
            req.on('end', () => {
                let dataForm = qs.parse(data)
                this.model.addDrinkDB(dataForm.type, dataForm.name, dataForm.price).then(() => {
                    resolve('them mon thanh cong');
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }

    getListDrink() {
        return new Promise((resolve, reject) => {
            this.model.getListDrinkDB().then(result => {
                resolve(result);
            })
        })
    }

    searchDrink(req, res) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
                data += chunk
            })
            req.on('end', () => {
                let dataForm = qs.parse(data);
                this.model.searchDB(dataForm.search_name).then(result => {
                    let html = '';
                    if (!result[0]) {
                        html += `<tr>`
                        html += `<td colspan="4" class="text-lg-center"><i>Không có kết quả</i></td>`
                        html += `</tr>`
                    } else {
                        result.forEach((value, index) => {
                            html += `<tr>`
                            html += `<td>${index + 1}</td>`
                            html += `<td><input type="text" name="name" value="${value.type} ${value.name}" readonly></td>`
                            html += `<td><input type="text" name="price" value="${value.price}" readonly></td>`
                            html += `<td><input type="number" name="amount" placeholder="số lượng"></td>`
                            html += `</tr>`
                        })
                        html += `<tr><td colSpan="4"><input type="submit" class="btn btn-info btn-block" value="Add"></td></tr>`
                    }
                    resolve(html);
                })
            })
        })
    }

    showListDrinkManager(req, res) {
        this.readPage('./view/manager.html').then(dataHtml => {
            this.model.getListDrinkDB().then(result => {
                let html = '';
                result.forEach((value, index) => {
                    html += `<tr>`;
                    html += `<td>${index + 1}</td>`;
                    html += `<td>${value.type}</td>`;
                    html += `<td>${value.name}</td>`;
                    html += `<td colspan="2">${value.price}</td>`;
                    html += `<td><button class="btn btn-warning"><a href="/home/manager/edit?id=${value.id}" class="text-dark">Edit</a></button></td>`
                    html += `<td><button class="btn btn-danger"><a href="/home/manager/delete?id=${value.id}" class="text-dark">Delete</a></button></td>`
                    html += `</tr>`;
                })
                dataHtml = dataHtml.replace('{result}', html);
                res.writeHead(200, 'OK', {'content-type': 'text/html'});
                res.write(dataHtml);
                res.end();
            })
        })
    }

    deleteDrinkManager(id) {
        return new Promise((resolve, reject) => {
            this.model.deleteDrinkDB(id).then(() => {
                resolve('xoa mon thanh cong');
            }).catch(err => {
                reject(err);
            });
        })
    }

    editDrinkManager(id, type, name, price) {
        return new Promise((resolve, reject) => {
            this.model.editDrinkDB(id, type, name, price).then(() => {
                resolve('sua mon thanh cong');
            }).catch(err => reject(err));
        })
    }

    showListTemp() {
        return new Promise((resolve, reject) => {
            this.model.getListTempDB().then(result => {
                this.model.getSumTemp().then(sum => {
                    if (sum[0].total === null) {
                        sum[0].total = 0;
                    }
                    let html = '';
                    result.forEach((value, index) => {
                        html += `<tr>`
                        html += `<td>${index + 1}</td>`
                        html += `<td><input type="text" name="name" value="${value.name_drink}" readonly></td>`;
                        html += `<td><input type="text" name="price" value="${value.price}" readonly></td>`
                        html += `<td><input type="text" name="amount" value="${value.amount}" readonly><button><a href="/home/delete_temp_db?id=${value.id}">Delete</a></button></td>`
                        html += `</tr>`
                    })
                    resolve({
                        list_temp: result,
                        result: html,
                        totalPrice: `${sum[0].total}`
                    });
                })
            })
        })
    }

    insertTemp(req, res) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => data += chunk)
            req.on('end', () => {
                let dataForm = qs.parse(data);
                if (dataForm.name) {
                    if (typeof dataForm.name === 'string') {
                        this.model.insertTempDB(dataForm.name, dataForm.price * dataForm.amount, dataForm.amount).then();
                    } else {
                        for (let i = 0; i < dataForm.name.length; i++) {
                            if (dataForm.amount[i] !== '') {
                                this.model.insertTempDB(dataForm.name[i], dataForm.price[i] * dataForm.amount[i], dataForm.amount[i]).then()
                            }
                        }
                    }
                    resolve();
                } else {
                    reject();
                }

            })
        })
    }

    deleteTemp(id) {
        return new Promise((resolve, reject) => {
            this.model.deleteTempDB(id).then(() => {
                resolve();
            }).catch(err => reject(err))
        })
    }

    deleteTempTable() {
        return new Promise((resolve, reject) => {
            this.model.deleteTempTableDB().then();
            resolve();
        })
    }

    insertBill(id_bill, name, price, amount) {
        return new Promise((resolve, reject) => {
            this.model.insertBillDB(id_bill, name, price, amount).then(() => {
                resolve();
            }).catch(err => {
                reject();
            })
        })
    }

    insertListBill(id_bill) {
        return new Promise((resolve, reject) => {
            this.model.getSumTemp().then(result => {
                this.model.insertListBillDB(id_bill, result[0].total).then(() => {
                    resolve();
                }).catch(err => {
                    console.log(err)
                    reject();
                })
            })
        })
    }

    getListBill() {
        return new Promise((resolve, reject) => {
            this.model.getListBillDB().then(result => {
                let html = '';
                result.forEach((value, index) => {
                    html += `<tr>`
                    html += `<td>${index + 1}</td>`
                    html += `<td>${value.id_bill}</td>`
                    html += `<td>${value.total}</td>`
                    html += `<td>${value.status}</td>`
                    html += `<td><button class="btn btn-info"><a href="/home/bill?id=${value.id_bill}" class="text-dark">Xem hóa đơn</a></buton></td>`
                    html += `</tr>`
                })
                resolve(html);
            })
        })
    }

    getBill(id_bill) {
        return new Promise((resolve, reject) => {
            this.model.getBillDB(id_bill).then(result => {
                resolve(result);
            }).catch(err => reject(err))
        })
    }

    getSumBill(id_bill) {
        return new Promise((resolve, reject) => {
            this.model.getSumBillDB(id_bill).then(result => {
                resolve(result);
            }).catch(err => reject(err))
        })
    }

    getNewIdBill() {
        return new Promise((resolve, reject) => {
            this.model.getListBillDB().then(result => {
                resolve(result[0].id_bill + 1)
            }).catch(err => reject(err))
        })
    }

}

module.exports = Controller;