module.exports = {
    imagesRoot: `${process.cwd()}/images`,
    limitFileSize: 10e6,

    mongodb: {
        url: 'mongodb://localhost:27017'
    },
    port: process.env.PORT | 3000
};
  