const express = require('express');
const app = new express()
const io = require('socket.io');
const http = require('http');
const url = require('url');
const qs = require('qs');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const fs = require('fs');
let Controller = require('./controller/controller');


const server = http.createServer((req, res) => {
    let urlPath = url.parse(req.url, true).pathname;
    let queryString = url.parse(req.url, true).query
    let controller = new Controller();

    const mimeTypes = {
        "html": "text/html",
        "js": "text/javascript",
        "css": "text/css",
        "jpeg": "image/jpeg",
        "svg": "image/svg+xml",
        "png": "image/png",
        "jpg": "image/jpg"
    };

    const filesDefences = req.url.match(/\.js$|.css$|.jpeg$|.svg$|.png$|.jpg$/);
    if (filesDefences) {
        const extension = mimeTypes[filesDefences[0].toString().split('.')[1]];
        res.writeHead(200, {'Content-Type': extension});
        fs.createReadStream(__dirname + req.url).pipe(res)
    } else {
        if (!req.headers.cookie) {
            if (req.method === 'GET') {
                controller.readPage('./view/login.html', req, res).then(result => {
                    res.writeHead(200, 'OK', {'content-type': 'text/html'})
                    res.write(result);
                    res.end();
                })
            } else {
                controller.login(req, res).then();
            }
        } else {
            let cookieReq = cookie.parse(req.headers.cookie);
            let cookieData={}
            if (cookieReq.cookieLogin) {
                cookieData = JSON.parse(cookieReq.cookieLogin);
            }

            switch (urlPath) {
                case '/':
                    if (req.method === 'GET') {
                        controller.readPage('./view/login.html', req, res).then(result => {
                            if (cookieData.user) {
                                result = result.replace(`<input class="form-control" placeholder="E-mail" name="email" type="text">`,
                                    `<input class="form-control" placeholder="E-mail" name="email" type="text" value="${cookieData.user.email}">`)
                                result = result.replace(`<input class="form-control" placeholder="Password" name="password" type="password">`,
                                    `<input class="form-control" placeholder="Password" name="password" type="password" value="${cookieData.user.password}">`)
                            }
                            res.writeHead(200, 'OK', {'content-type': 'text/html'});
                            res.write(result);
                            res.end();
                        }).catch(err => console.log(err));
                    } else {
                        controller.login(req, res).then();
                    }
                    break;

                case '/home':
                    controller.checkSessionId(req, res).then(() => {
                        if (req.method === 'GET') {
                            controller.readPage('./view/home.html').then(dataHtml => {
                                controller.showListTemp().then(result_temp => {
                                    controller.getListBill().then(result => {
                                        controller.getNewIdBill().then(id_bill => {
                                            dataHtml = dataHtml.replace('{result}', result_temp.result);
                                            dataHtml = dataHtml.replace('<td><b><i></i></b></td>', `<td><b><i>${result_temp.totalPrice}</i></b></td>`);
                                            dataHtml = dataHtml.replace('{list-bill}', result);
                                            dataHtml = dataHtml.replace('<input type="text" name="id_bill" class="text-center" style="width: 100%; height: 40px" readonly>',
                                                `<input type="text" name="id_bill" class="text-center text-danger" style="width: 100%; height: 40px" value="${id_bill}" readonly>`)
                                            res.writeHead(200, 'OK', {'content-type': 'text/html'});
                                            res.write(dataHtml);
                                            res.end();
                                        })
                                    })
                                })
                            })
                        } else {
                            controller.readPage('./view/home.html').then(dataHtml => {
                                controller.getListBill().then(list_bill => {
                                    controller.searchDrink(req, res).then(result_search => {
                                        controller.showListTemp().then(result => {
                                            controller.getNewIdBill().then(id_bill => {
                                                dataHtml = dataHtml.replace('<input type="text" name="id_bill" class="text-center" style="width: 100%; height: 40px" readonly>',
                                                    `<input type="text" name="id_bill" class="text-center text-danger" style="width: 100%; height: 40px" value="${id_bill}" readonly>`)
                                                dataHtml = dataHtml.replace('{result}', result.result);
                                                dataHtml = dataHtml.replace('<td><b><i></i></b></td>', `<td><b><i>${result.totalPrice}</i></b></td>`);
                                                dataHtml = dataHtml.replace('<tr><td colspan="4" class="text-lg-center"><i>Không có kết quả</i></td></tr>', result_search);
                                                dataHtml = dataHtml.replace('{list-bill}', list_bill);
                                                res.writeHead(200, 'OK', {'content-type': 'text/html'});
                                                res.write(dataHtml);
                                                res.end();
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/manager':
                    controller.checkSessionId(req, res).then(() => {
                        if (req.method === 'GET') {
                            controller.showListDrinkManager(req, res);
                        }
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/manager/delete':
                    controller.checkSessionId(req, res).then(() => {
                        controller.deleteDrinkManager(queryString.id).then(message => {
                            console.log(message);
                            controller.showListDrinkManager(req, res);
                            res.writeHead(301, {location: '/home/manager'})
                            res.end();
                        }).catch(err => console.log(err));
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/manager/edit':
                    controller.checkSessionId(req, res).then(() => {
                        if (req.method === 'GET') {
                            controller.readPage('./view/edit.html').then(dataHtml => {
                                controller.getListDrink().then(result => {
                                    result.forEach(value => {
                                        if (queryString.id === `${value.id}`) {
                                            dataHtml = dataHtml.replace('<td><input type="text" name="id"></td>', `<td><input type="text" name="id" value="${value.id}" readonly></td>`)
                                            dataHtml = dataHtml.replace('<td><input type="text" name="type"></td>', `<td><input type="text" name="type" value="${value.type}" required></td>`)
                                            dataHtml = dataHtml.replace('<td><input type="text" name="name"></td>', `<td><input type="text" name="name" value="${value.name}" required></td>`)
                                            dataHtml = dataHtml.replace('<td><input type="text" name="price"></td>', `<td><input type="text" name="price" value="${value.price}" required></td>`)
                                            res.writeHead(200, 'OK', {'content-type': 'text/html'});
                                            res.write(dataHtml);
                                            res.end();
                                        }
                                    })
                                })
                            })
                        } else {
                            let data = '';
                            req.on('data', chunk => data += chunk)
                            req.on('end', () => {
                                let dataForm = qs.parse(data);
                                controller.getListDrink().then(result => {
                                    result.forEach(value => {
                                        if (dataForm.id === `${value.id}`) {
                                            controller.editDrinkManager(value.id, dataForm.type, dataForm.name, dataForm.price).then((result) => {
                                                res.writeHead(301, {location: '/home/manager'})
                                                res.end();
                                            }).catch(err => console.log(err));
                                        }
                                    })
                                })
                            })
                        }
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/manager/add':
                    controller.checkSessionId(req, res).then(() => {
                        if (req.method === 'POST') {
                            controller.addDrinkManager(req, res).then(result => {
                                console.log(result);
                                res.writeHead(301, {location: '/home/manager'});
                                return res.end();
                            })

                        }
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/insert_temp':
                    controller.checkSessionId(req, res).then(() => {
                        if (req.method === 'POST') {
                            controller.insertTemp(req, res).then(() => {
                                res.writeHead(301, {location: '/home'})
                                res.end();
                            }).catch(() => {
                                res.writeHead(301, {location: '/home'})
                                res.end();
                            })
                        }
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/delete_temp_db':
                    controller.checkSessionId(req, res).then(() => {
                        controller.deleteTemp(queryString.id).then(() => {
                            res.writeHead(301, {location: '/home'})
                            res.end();
                        })
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/insert_list_bill':
                    controller.checkSessionId(req, res).then(() => {
                        let data = '';
                        req.on('data', chunk => data += chunk)
                        req.on('end', () => {
                            let dataForm = qs.parse(data);
                            controller.insertListBill(dataForm.id_bill).then(() => {
                                if (typeof dataForm.name === 'string') {
                                    controller.insertBill(dataForm.id_bill, dataForm.name, dataForm.price, dataForm.amount).then()
                                } else {
                                    for (let i = 0; i < dataForm.name.length; i++) {
                                        controller.insertBill(dataForm.id_bill, dataForm.name[i], dataForm.price[i], dataForm.amount[i]).then()
                                    }
                                }
                                controller.deleteTempTable().then(() => {
                                    res.writeHead(301, {location: '/home'})
                                    res.end();
                                });
                            }).catch(() => {
                                res.writeHead(301, {location: '/home'})
                                res.end();
                            })
                        })
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/home/bill':
                    controller.checkSessionId(req, res).then(() => {
                        controller.readPage('./view/bill.html').then(dataHtml => {
                            controller.getSumBill(queryString.id).then((total) => {
                                controller.getBill(queryString.id).then(result => {
                                    let html = ''
                                    result.forEach((value, index) => {
                                        html += `<tr>`
                                        html += `<td>${index + 1}</td>`
                                        html += `<td>${value.name_drink}</td>`
                                        html += `<td>${value.price}</td>`
                                        html += `<td>${value.amount}</td>`
                                        html += `</tr>`
                                    })
                                    dataHtml = dataHtml.replace('{id-bill}', `${result[0].id_bill}`)
                                    dataHtml = dataHtml.replace('{result}', html)
                                    dataHtml = dataHtml.replace('{total}', total[0].total)
                                    res.writeHead(200, 'ok', {'content-type': 'text/html'})
                                    res.write(dataHtml)
                                    res.end();
                                })
                            })
                        })
                    }).catch(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;

                case '/log_out':
                    controller.logOut(req).then(() => {
                        res.writeHead(301, {location: '/'})
                        res.end();
                    })
                    break;
            }
        }
    }
})


server.listen(8000, 'localhost', () => {
    console.log('http://localhost:8000/home');
})