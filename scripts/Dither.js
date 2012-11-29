function Dither(Display){
	var copy_canvas = document.createElement("canvas");;
	copy_canvas.width = 128;//canvas.width;
	copy_canvas.height = 64;//canvas.height;
	this.ctx = copy_canvas.getContext("2d");
	var w = copy_canvas.width;
	var h = copy_canvas.height;
	this.display = Display;
	this.img = new Image();
	this.img.vertical_scan = false;
	this.img.raster = true;
	var _parent = this;

	this.loadImage = function(src){

// function to handle asynchronous nature of image onload
// deferred.resolve() will only resolve the promise object
// after all other tasks in .draw() have completed

		var deferred = $.Deferred();
	    	$(_parent.img).load(function() {
			_parent.draw(function(){
			});
			deferred.resolve();
		});
	    	_parent.img.src = src;
	    	return deferred.promise();
	};
 
	this.draw = function(callback){
		callback = (callback !== undefined) ? callback : function(){};
		var deferred = deferred;
		var img_w = _parent.img.width;
		var img_h = _parent.img.height;
		var ar = img_w/img_h;
		_parent.ctx.clearRect(0,0,w,h);
		_parent.ctx.fillStyle = "white";
		_parent.ctx.fillRect(0,0,w,h);
		if ((img_w > w) || (img_h > h)){

	// image won't fit. Scale it appropriately while preserving aspect ratio 
	// and center it on the canvas
			if (img_w > img_h){
				_parent.ctx.drawImage(_parent.img,0,0.5*(h-(w/ar)),w,w/ar);
			} else {
				_parent.ctx.drawImage(_parent.img,0.5*(w - (h*ar)),0,h*ar,h);
			}
		} else {

	// image fits. Center and draw it. 

			_parent.ctx.drawImage(_parent.img,0.5*(w-img_w),0.5*(h-img_h));
		}
		_parent.display.ctx.drawImage(_parent.img, 0, 0);
	// expose the original image data. I don't think this is really necessary, but may be useful at some point

		_parent.original_img_data = _parent.ctx.getImageData(0,0,copy_canvas.width, copy_canvas.height);
	        var imgData = grayscale(_parent.original_img_data);	
		imgData = dither(imgData, _parent.img.vertical_scan, _parent.img.raster);
		_parent.ctx.putImageData(imgData,0,0);
		_parent.display.clear();
		_parent.display.stateBuffer = (function(){
			var output = [];
			var data = imgData.data;
			var row, col, index;
			for (var i=0; i < (imgData.width * imgData.height); i+=1){
				row = parseInt(i / w);
				col = i % w;
				index = parseInt((row*w) + col);
				output[col*h + row] = (data[i*4] > 128) ? 0 : 1;//(data[index] === 255) ? 1 : 0;		
			}
			return output;
		})();
		_parent.display.drawBuffer();
	};

	function dither(imgData, vertical_scan, raster){
		var data = imgData.data;
		var w = imgData.width;
		var h = imgData.height;
		var d_index = 0;
		var new_value, old_value, err;
		var x = y = 0;
		var dx = dy = 1;
		
		if (raster){
			rasterScan();
		} else {
			serpentineScan();
		}

		imgData.data = data;
		return imgData;

		function rasterScan(){
			if (vertical_scan){
				for(y = 0; y < h; y++){
					for (x = 0; x < w; x++){
						diffuseError();
					}
				}
			} else {
				for (x = 0; x < w; x++){
					for(y = 0; y < h; y++){
						diffuseError();
					}
				}
			}	
		}


		function serpentineScan(){
			if (vertical_scan){
				while (x < w){
					diffuseError();
					y += dy;

					if (y === h){
						dy = -1;
						x += 1;
					} 

					if (y === -1){
						dy = 1;
						x += 1;
					}
				}
			} else {
				while (y < h){
					diffuseError();
					x += dx;
					if (x === w){
						dx = -1;
						y += 1;
					} 
					if (x === -1){
						dx = 1;
						y += 1;
					}
				}
			}
		}

// private member function to calculate and propogate 
// the error to adjacent pixels
// according to the atkinson dithering algorithm
//	    x  1/8 1/8 
//     1/8 1/8 1/8
//         1/8

		function diffuseError(){
				var nxy = [{x: x+1, y: y},
					   {x: x+2, y: y},
					   {x: x-1, y: y+1},
					   {x: x, y: y+1},
					   {x: x+1, y: y+1},
					   {x: x, y: y+2}];
				d_index = findDataIndex(x, y, w);	
				old_value = data[d_index];
				new_value = (old_value > 128) ? 255 : 0;
				data[d_index] = data[d_index + 1] = data[d_index + 2] = new_value;
				err = (old_value - new_value) >> 3;
				$.each(nxy, function(i, px){
					if (inBounds(px.x, px.y, w, h)){
						var o_index = findDataIndex(px.x, px.y, w);
						var val = data[o_index];
						data[o_index] = data[o_index + 1] = data[o_index + 2] = val + err;
					}
				});
		}

// private member function to find corresponding index within the imageData.data array 
// for a given pixel at coordinate (x,y);


// private member function to test whether a given pixel lies within the bounds of 
// image

		function inBounds(x, y, width, height){
			if((x >= 0) && (x < width)){
				if ((y >= 0) && (y < height)){
					return true;
				}
			}
			return false;
		}
	};

	function findDataIndex(x, y, width){
		return (y*width*4) + (x*4);
	};

	function grayscale(imgData){
		var r,g,b,a,l;
		var data = imgData.data;

		for (var i=0; i< data.length; i+=4){
			r = data[i];
			g = data[i + 1];
			b = data[i + 2];
			a = data[i + 3];

			l = 0.299*r + 0.587*g + 0.114*b;
			data[i] = data[i+1] = data[i+2] = l;
		}	
		imgData.data = data;
		return imgData;
	};
}
