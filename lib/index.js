/*jshint node: true*/
var XRay = require('x-ray');
var request = require('request');
var fs = require('fs');
var path = require('path');
var ProgressBar = require('progress');
var downloader = function (links, downloadPath) {
    console.log(links.length + " images to be downloaded.");
    // Progress bar to notify progress
    var bar = new ProgressBar("Downloading Images [:bar] :percent", {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: links.length
    });

    // ensure we are pooling the requests a bit
    var doRequest = request.defaults({
        pool: {
            maxSocket: 10
        }
    });

    links.forEach(function (link) {

        // ignore empty link
        if (!link) return;

        // do the request !
        var req = doRequest.get(link).on('response', function (response) {
            // only handle the 200
            if (response.statusCode !== 200) {
                console.error(link + " statusCode " + response.statusCode);
                return;
            }
            var fileName = (function () {
                //FUTURE: Provision for renaming on the fly
                return path.basename(response.request.uri.pathname + ".jpg");
            })();

            var fp = path.join(downloadPath, fileName);

            //Check if file already downloaded
            if (fs.existsSync(fp)) {
                var stat = fs.statSync(fp);
                if (stat.size == parseInt(response.headers['content-length'])) {
                    bar.tick();
                    req.abort();
                    return;
                } else {
                    //Remove incomplete download
                    fs.unlinkSync(fp);
                }
            }

            // now that we have the fileName, stream write the content
            req.on('end', function () {
                bar.tick();
            }).pipe(fs.createWriteStream(path.join(downloadPath, fileName)));

        }).on('error', function (err) {
            console.error(err);
        });
    });
};
module.exports = function (downloadPath, onlyfeatured) {
    var images = [];
    var base_url = "http://unsplash.com/filter?category[2]=0&category[3]=0&category[4]=0&category[6]=0&category[7]=0&category[8]=0";
    var x = XRay();
    var i = function (p, f) {
        var u = base_url + ((p > 1) ? "&page=" + p : "") + ((f) ? "&scope[featured]=1" : "&scope[featured]=0");
        console.log("Crawling Page - " + p);
        x(u, "body", {
            images: [".photo a@href"],
            last: ".pagination span.next_page.disabled"
        })(function (err, content) {
            if (err) {
                console.error(err);
                return i(p, f);
            }
            if (content.images)
                images = images.concat(content.images);
            if (!!!content.last)
                return i(p + 1, f);
            else {
                downloader(images, downloadPath);
            }
        });
    };
    i(1, onlyfeatured === true);
};
