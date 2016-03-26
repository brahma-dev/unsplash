/*jshint node: true*/
var XRay = require('x-ray');
var request = require('request');
var fs = require('fs');
var path = require('path');
var jf = require('jsonfile');
var queue = require('queue');
var progress = require('smooth-progress');
var downloader = function(links, downloadPath) {
	console.log(links.length + " images to be downloaded.");
	// Progress bar to notify progress
	var bar = progress({
		tmpl: 'Downloading... :bar :percent :eta',
		width: 25,
		total: parseInt(links.length),
	});
	// ensure we are pooling the requests a bit
	var doRequest = request.defaults({
		pool: {
			maxSocket: 10
		},
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
		}
	});
	var queue = require('queue');
	var q = queue({
		concurrency: 4
	});
	links.forEach(function(link, index) {
		q.push(function(cb) {
			// ignore empty link
			if (!link) {
				return;
			}
			// do the request !
			var req = doRequest.get(link + "/download").on('response', function(response) {
				// only handle the 200
				if (response.statusCode !== 200) {
					bar.tick(1); //error
					return cb();
				}
				var fileName = (function() {
					//FUTURE: Provision for renaming on the fly
					return path.basename(response.request.uri.pathname + ".jpg");
				})();

				var fp = path.join(downloadPath, fileName);

				//Check if file already downloaded
				fs.exists(fp, function(ex) {
					if (ex) {
						var stat = fs.statSync(fp);
						if (stat.size == parseInt(response.headers['content-length'])) {
							bar.tick(1);
							req.abort();
							return cb();
						} else {
							//Remove incomplete download
							fs.unlinkSync(fp);
						}
					}
				});

				// now that we have the fileName, stream write the content
				req.on('end', function() {
					bar.tick(1);
					return cb();
				}).pipe(fs.createWriteStream(fp));

			}).on('error', function(err) {
				bar.tick(1); //error
				return cb();
			});
		});
		if (index == links.length - 1) {
			q.start(function(err) {
				fs.unlinkSync(path.join(downloadPath, "images.json"));
				process.exit();
			});
		}
	});
};
module.exports = function(downloadPath, onlyfeatured) {
	fs.exists(path.join(downloadPath, "images.json"), function(exists) {
		if (exists) {
			jf.readFile(path.join(downloadPath, "images.json"), function(err, obj) {
				if (err) {
					console.log(err);
				}
				images = obj;
				downloader(images, downloadPath);
			});
		} else {
			var images = [];
			var base_url = "http://unsplash.com/";
			var x = XRay();
			var i = function(p, f) {
				var u = base_url + ((!!!f) ? "new" : "") + ((p > 1) ? "?page=" + p : "");
				console.log("Crawling Page - " + p);
				x(u, "body", {
					images: [".photo a@href"],
					last: ".pagination span.next_page.disabled"
				})(function(err, content) {
					if (err) {
						console.error(err);
						return i(p, f);
					}
					var re = /http:\/\/unsplash\.com\/photos\/[0-9a-zA-Z]+/;
					if (content.images) {
						for (var img in content.images) {
							if (re.exec(content.images[img]) !== null) {
								images.push(content.images[img]);
							}
						}
					}
					if (!!!content.last) {
						return i(p + 1, f);
					} else {
						jf.writeFile(path.join(downloadPath, "images.json"), images, function(err) {
							if (err) {
								console.log(err);
							}
							downloader(images, downloadPath);
						});
					}
				});
			};
			i(1, onlyfeatured === true);
		}

	});

};
