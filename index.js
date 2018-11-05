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
                    }).then(() => {
                        res.writeHead(302, {'Location': '/'});
                        res.end();
                    }).catch((err) => {
                        console.error(err);
                        res.writeHead(302, {'Location': '/'});
                        res.end();
                    });
                
            }); 

        }
    };

    if (req.method === 'GET') {
        if (pathname === '/') {
            let _db;
            mongoClient.connect(mongoUrl, {useNewUrlParser: true})
                .then((db) => {
                    _db = db;
                    return db.db('image-test').collection('images').find().toArray()
                }).then((result) => {
                    console.log(result);
                    res.end(pug.renderFile('./templates/index.pug', {images: result}))
                })
            return;
        };
        let filePath = path.join(config.get('imagesRoot'), pathname);

        let mime = {
            html: 'text/html',
            txt: 'text/plain',
            css: 'text/css',
            gif: 'image/gif',
            jpg: 'image/jpeg',
            png: 'image/png',
            svg: 'image/svg+xml',
            js: 'application/javascript'
        };

                
        let type = mime[path.extname(filePath).slice(1)] || 'text/plain';

        let fileStream = fs.createReadStream(filePath);

        fileStream.on('open', () => {
            res.writeHead(200, {'Content-Type': type});
            fileStream.pipe(res);
        });

        fileStream.on('error', (err) => {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            return res.end('Not found');
        })
    }

});

server.listen(3000, () => {
    console.log('server...')
});