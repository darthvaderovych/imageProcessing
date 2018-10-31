const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const config = require('config');
const pug = require('pug');
const { parse } = require('querystring');
const loadImage = require('./loadImage');

const mongoClient = require('mongodb').MongoClient;
const mongoUrl = config.mongodb.url;



const server = http.createServer((req, res) => {
    let parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    console.log(req.method, pathname);
    if (req.method === 'POST') {
        if(pathname === '/') {
            let body = '';

            req.on('data', (chunk) => {
                body += chunk.toString()
            });

            req.on('end', () => {
                console.log(body);
                let imgUrl = parse(body).url;
                let imgName = url.parse(imgUrl).pathname.split('/').pop();
                let imgPath = path.join(config.get('imagesRoot'), imgName);
                let _db;

                loadImage(imgUrl).then(() => {
                        return mongoClient.connect(mongoUrl, {useNewUrlParser: true})
                    }).then((db) => {
                        _db = db;
                        let imgObj = {name: imgName, path: imgPath, date: new Date()};
                        return db.db('image-test').collection('images').insertOne(imgObj)
                    }).then(() => { 
                       return _db.close();
                    }).then(res.end(pug.renderFile('./templates/index.pug'))).catch((err) => {
                        console.error(err);
                    });
                
                // loadImage(imgUrl).then(res.end(pug.renderFile('./templates/index.pug'))).catch((err) => {
                //     console.error(err);
                // });
            });

        }
    };

    if (req.method === 'GET') {
        if (pathname === '/') {
            res.writeHead(200)
            res.end(pug.renderFile('./templates/index.pug'));
        }
    }

});

server.listen(3000, () => {
    console.log('server...')
});