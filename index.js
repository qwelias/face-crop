"use strict";

const FD = require( 'face-detect' );
const Canvas = require( 'canvas' );
const fs = require( 'fs' );
const Log = require('debug')("facecrop");

const Image = Canvas.Image;

const process = ( options ) => new Promise( ( resolve, reject ) => {
    if(!options.src || !options.dst) return reject(new Error('"src" and "dst" options required'))

    options = Object.assign({
        scale: 1
    }, options);

    Log(options);

	let img = new Image();
	img.onerror = ( err ) => {
		reject( err );
	};
	img.onload = () => {
		let w = img.width;
		let h = img.height;
		let canvas = new Canvas( w, h );
		let ctx = canvas.getContext( '2d' );

		ctx.drawImage( img, 0, 0, w, h, 0, 0, w, h );

		let faces = FD.detect_objects( {
			"canvas": canvas,
			"interval": 5,
			"min_neighbors": 1
		} );

        if(faces.length == 0) return reject(new Error('No faces detected'));

        Log(faces);

        let face = faces.sort((a, b) => a.confidence - b.confidence)[0];

        Log(face);

        face.cX = face.x + face.width / 2;
        face.cY = face.y + face.height / 2;

        if(options.dst.width || options.dst.height){
            options.dst.width = options.dst.width || options.dst.height;
            options.dst.height = options.dst.height || options.dst.width;
            let ratio = options.dst.width / options.dst.height;
            if(ratio > 1) face.width = face.height * ratio;
            if(ratio < 1) face.height = face.width / ratio;
        };
        let width = Math.min(w, face.width * options.scale);
        let height = Math.min(h, face.height * options.scale);
        let X = Math.max(0, face.cX - width / 2 );
        let Y = Math.max(0, face.cY - height / 2 );

        Log(X, Y, width, height);

        let outWidth = options.dst.width || width;
        let outHeight = options.dst.height || height;

        let outCanvas = new Canvas(outWidth, outHeight);
        let outCtx = outCanvas.getContext('2d');

        outCtx.imageSmoothingEnabled = true;

        outCtx.drawImage(img, X, Y, width, height, 0, 0, outWidth, outHeight);

        let out = fs.createWriteStream(options.dst.path);

        out.on('finish', () => resolve(options.dst.path));

        outCanvas.pngStream().pipe(out);
	};
	img.src = options.src;
} );

module.exports = process;
