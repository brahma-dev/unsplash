# Unsplash Image Downloader

An Unsplash auto-downloader and sync tool for node.js.

## Introduction

Hacker's way of grabbing all of the images at Unsplash.com quickly, easily, and for free.

## Install

Install this package globally via NPM by running the following command:

```shell
npm install -g unsplash
```

You now have access to the `unsplash` command.

## Usage

```shell
unsplash [options] <folder>
```

The `unsplash` command accepts two options and a path to directory:

* -h, --help		|| output usage information .
* -f, --featured 	|| download only featured images.
* [folder] defaults to current directory

### To save images to your current folder

Navigate to the path that you want to save the files in and execute the `unsplash` command with the --featured options if you want only featured images. Here is an example:

```shell
unsplash -f
```

This will tell the program to save featured images to your current working directory. It will not download or overwrite any existing files.

### To save images to a specific folder

Same as above but specify the path to the save directory from your current working directory as the third argument. For example:

```shell
unsplash wallpapers/
```

This will tell the program to save all images to the wallpapers directory. It will not download or overwrite any existing files.

### Cache

The scraped image URLs are saved in a json file `images.json` inside the same folder. This is to avoiding rescraping if the process fails. To force a rescrape delete the file before running unsplash.

### Use as a Node.js module.
Unsplash is also available as a Node.js module.

```
var unsplash = require('unsplash');
unsplash(<string:path>,[boolean: onlyfeatured])
```


## License ##

(The MIT License)

Copyright (c) 2015 Afzaalace;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.