
const cluster = require('cluster');

if (cluster.isMaster) {
	let numCPUs = require('os').cpus().length;
	console.log(`Master ${process.pid} is running`);

	for (let i = 0; i <numCPUs; i += 1) {
		cluster.schedulingPolicy = cluster.SCHED_NONE;
		cluster.fork();
	};

	cluster.on('exit', (worker) => {
		console.log(`worker ${worker.process.pid} died`);
		cluster.fork();
	});

} else {
    require('./server');
}
