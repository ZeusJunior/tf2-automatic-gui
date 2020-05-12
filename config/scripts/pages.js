const fs = require('fs');

let baseDir='.\\src\\web\\'



module.exports = function(){
	let ret = [];
	fs.readdirSync(baseDir).forEach(file => {
		if(/\.html$/.test(file)) ret.push({
			dir: baseDir,
			name: file.substring(0, file.length - 5)
		});
	});
	return ret;
}
