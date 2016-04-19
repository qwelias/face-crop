"use strict";

const FD = require( 'face-detect' );
const Canvas = require( 'canvas' );
const fs = require( 'fs' );
const Log = require( 'debug' )( "facecrop" );

const Image = Canvas.Image;

const process = ( options ) => new Promise( ( resolve, reject ) => {
	if ( !options.src || !options.dst ) return reject( new Error( '"src" and "dst" options required' ) )

	options = Object.assign( {
		scale: 1,
		force: false
	}, options );

	Log( options );

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

		if ( faces.length == 0 && !options.force ) return reject( new Error( 'No faces detected' ) );

		Log( faces );

		let face = faces.sort( ( a, b ) => b.confidence - a.confidence )[ 0 ];

		Log( face );

        if(!face) face = {
            x: 0,
            y: 0,
            width: w,
            height: h
        }

		face.cX = face.x + face.width / 2;
		face.cY = face.y + face.height / 2;

        let ratio = face.width / face.height;

		if ( options.dst.width || options.dst.height ) {
            ratio = options.dst.width / options.dst.height;
			options.dst.width = options.dst.width || options.dst.height;
			options.dst.height = options.dst.height || options.dst.width;
			if ( ratio > 1 ) face.width = face.height * ratio;
			if ( ratio < 1 ) face.height = face.width / ratio;
            if ( ratio == 1 ){
                let max = Math.max(face.width, face.height);
                face.width = max;
                face.height = max;
            }
		};

		let width = face.width * options.scale;
		let height = face.height * options.scale;

        let coverRatio = Math.max(width / w, height / h);
        if(coverRatio > 1){
            width = width / coverRatio;
            height = height / coverRatio;
        }

		let X = Math.max( 0, face.cX - width / 2 );
		let Y = Math.max( 0, face.cY - height / 2 );

		Log( X, Y, width, height );

		let outWidth = options.dst.width || width;
		let outHeight = options.dst.height || height;

		let outCanvas = new Canvas( outWidth, outHeight );
		let outCtx = outCanvas.getContext( '2d' );

		outCtx.imageSmoothingEnabled = true;

		outCtx.drawImage( img, X, Y, width, height, 0, 0, outWidth, outHeight );

		let out = fs.createWriteStream( options.dst.path );

		out.on( 'finish', () => resolve( options.dst.path ) );

		outCanvas.pngStream().pipe( out );
	};
	img.src = options.src;
} );

module.exports = process;
