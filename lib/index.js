var fs = require('fs');
var async = require('async');
var cheerio = require('cheerio')
var request = require('request')
var path = require('path')
var exec = require('child_process').exec
var pretty = require('prettysize')
var archiver = require('archiver')

var headers = {
    'User-Agent': 'Unsplash-Download-Tool'
}
module.exports = {
    download: function (downloadPath, onlyfeatured) {
        var changedMetadata = false
        try {
            var metadata = require(downloadPath + '/metadata.json')
        } catch (error) {
            var metadata = []
        }
        var root_url = onlyfeatured ? 'https://unsplash.com/filter?scope[featured]=1' : 'https://unsplash.com/filter?scope[featured]=0';

        var getPageCountAndDownload = function () {
            getPageCount(function (pageCount) {
                async.times(pageCount, function (page, next) {
                    getImageInfo(page += 1, function (error, imageInfo) {
                        next(error, imageInfo)
                    })
                }, function (error, imageInfo) {
                    var imagesToDownload = []

                    imageInfo.forEach(function (imageInfoList) {
                        imagesToDownload = imagesToDownload.concat(imageInfoList)
                    })

                    prepareToDownloadImages(imagesToDownload)
                })
            })
        }
        var getPageCount = function (callback) {
            var highestPage = 0
            request(root_url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(body)
                    $('.pagination a').each(function (index, element) {
                        var linkText = $(this).text()

                        if (!isNaN(parseInt(linkText)) && (parseInt(linkText) > highestPage)) {
                            highestPage = parseInt(linkText)
                        }
                    })
                    callback(highestPage)
                }
            })
        }
        var imageAlreadyExists = function (imageMetadata) {
            var images = metadata.filter(function (image) {
                return image.image_url === imageMetadata.image_url
            })

            if (images.length) {
                return images[0]
            }

            return false
        }
        var getImageInfo = function (page, callback) {
            var imageInfo = []

            request(root_url + '&page=' + page, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(body)

                    $('.photo-container').each(function (index, element) {
                        var url = $(this).find('.photo a').attr('href')
                        var post_url = 'https://unsplash.com' + url.replace('/download', '')
                        var imageMetadata = {
                            'post_url': post_url,
                            'image_url': 'https://unsplash.com' + url,
                            'unsplash_id': url.replace('/photos/', '').replace('/download', '')
                        }

                        $(this).find('.epsilon a').each(function (index, element) {
                            var linkText = $(this).text()
                            var linkURL = $(this).attr('href')

                            if (linkText === 'Download') {
                                imageMetadata.image_url = imageMetadata.image_url ? imageMetadata.image_url : linkURL
                            } else {
                                imageMetadata.author_url = 'https://unsplash.com' + linkURL
                                imageMetadata.author = linkText
                            }
                        })

                        if (!imageMetadata.author) {
                            var the_author = $(this).find('.epsilon p').text().split('/')[1]
                            imageMetadata.author = the_author ? removeSpaces(the_author.replace('By', '')) : 'Unknown'
                        }
                        if (!imageMetadata.image_url) {
                            console.log('Could not find image url for ' + post_url)
                        } else {
                            var exists = imageAlreadyExists(imageMetadata)

                            if (exists) {
                                var currentMetadata = metadata[metadata.indexOf(exists)]

                                if (currentMetadata.post_url !== imageMetadata.post_url || currentMetadata.author !== imageMetadata.author || currentMetadata.author_url !== imageMetadata.author_url) {
                                    changedMetadata = true

                                    metadata[metadata.indexOf(exists)].post_url = imageMetadata.post_url
                                    metadata[metadata.indexOf(exists)].author = imageMetadata.author
                                    metadata[metadata.indexOf(exists)].author_url = imageMetadata.author_url
                                }
                            } else {
                                imageInfo.push(imageMetadata)
                            }
                        }
                    })

                    callback(null, imageInfo)
                } else {
                    console.log('Failed getting image info %s', page)
                    callback(true)
                }
            })
        }

        var removeSpaces = function (str) {
            return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
        }

        var prepareToDownloadImages = function (imagesToDownload) {
            var highestId = metadata.length

            if (!imagesToDownload.length) {
                console.log('Nothing to download!')

                if (changedMetadata) {
                    postDownloadTasks()
                }

                return
            }

            imagesToDownload.reverse()

            async.mapSeries(imagesToDownload, function (image, next) {
                image.id = highestId++
                    next(null, image)
            }, function (error, imagesToDownloadWithId) {
                downloadImages(imagesToDownloadWithId)
            })
        }

        var downloadImages = function (imagesToDownload) {
            var currentPost = 0
            async.eachLimit(imagesToDownload, 5, function (imageToDownload, next) {
                console.log('Downloading image ' + (currentPost++ +1) + ' of ' + imagesToDownload.length + ' (' + imageToDownload.post_url + ')')

                downloadImage(imageToDownload, function (the_metadata) {
                    metadata.push(the_metadata)
                    next()
                })
            }, function (error) {
                console.log('Done!')

                metadata.sort(function (a, b) {
                    return a.id - b.id
                })

                if (check_for_deleted) {
                    checkForDeletedImages(true)
                } else {
                    postDownloadTasks()
                }
            })
        }

        var postDownloadTasks = function () {
            fs.writeFile(path.resolve(downloadPath, 'metadata.json'), JSON.stringify(metadata, null, 4), 'utf8', function (error) {
                if (error) {
                    console.log('Error writing metadata!')
                    return console.log(error)
                }
            })
        }

        var downloadImage = function (the_metadata, callback) {
            var filename = String('0000' + the_metadata.id).slice(-4) + '_' + the_metadata.unsplash_id + '.jpeg'
            the_metadata.filename = filename
            var file = fs.createWriteStream(path.resolve(downloadPath, filename))

            file.on('finish', function () {
                file.close(function () {
                    callback(the_metadata)
                })
            })

            request.get({
                url: the_metadata.image_url,
                headers: headers
            }).pipe(file)
        }
        getPageCountAndDownload();
    }
}
