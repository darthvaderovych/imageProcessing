const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const config = require('config');
const fs = require('fs');
const sharp = require('sharp');


const loadImage = (imgUrl) => {
    return new Promise((resolve, reject) => {
    
        let imgName = url.parse(imgUrl).pathname.split('/').pop();
        let imgPath = path.join(config.get('imagesRoot'), imgName);

        let writeStream = fs.createWriteStream(imgPath);

        let size = 0;

        let imgResize = sharp().resize(1334, 750);

        let httpLib = http;

        if(/^https/.test(imgUrl)) {
            httpLib = https;
        }

        httpLib.get(imgUrl, (imgRes) => {
            if(imgRes.headers['content-length'] > config.get('limitFileSize')) {
                writeStream.destroy();
                fs.unlink(imgPath, (error) => { });
                reject(new Error(`File size is bigger than ${config.get('limitFileSize')}`))
            };

            imgRes.on('data', (chunk) => {
                size += chunk.length;
        
                if (size > config.get('limitFileSize')) {
                    writeStream.destroy();
                    fs.unlink(imgPath, (error) => { });
                    reject(new Error(`File size is bigger than ${config.get('limitFileSize')}`))
                }
            }).pipe(imgResize).pipe(writeStream);

        }).on('error', () => {
            reject(new Error('Error while making request'))
        });

        imgResize.on('error', (err) => {
            reject(new Error(err));
        })

        writeStream.on('error', (err) => {
            if (err.code === 'EEXIST') {  // writestream {flags: 'wx'}
                return reject(new Error('Write stream error: file already exists'))
            } else {
                fs.unlink(imgPath, (error) => { });
                return reject(new Error('Write stream error'))

            }
        }).on('close', () => {
            fs.access(imgPath, (err) => { //check if file exist
                if (err) {
                    reject(new Error('Image was not saved'));
                } else {
                    resolve();              
                }
            })
        });
    });
};

module.exports = loadImage;