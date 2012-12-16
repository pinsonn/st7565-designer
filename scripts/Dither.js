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
		imgData = dither(imgData, _parent.img);
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
				output[col*h + row] = (data[i*4] === 255) ? 0 : 1;//(data[index] === 255) ? 1 : 0;		
			}
			return output;
		})();
		_parent.display.drawBuffer();
	};


	function ErrorTechnique(initObj){
		this.name = initObj.name;
		this.weights = initObj.weights || 1;
		this.divisor = initObj.divisor;
		this.nxy_offsets = initObj.nxy_offsets;
		var _parent = this;
		this.setNXY = function(x, y){
			_parent.nxy = [];
			var temp_obj;
			var dx, dy;
			for (var i=0; i < this.nxy_offsets.length; i += 1){
				temp_obj = {x: 0, y: 0};
				dx = _parent.nxy_offsets[i].dx;
				dy = _parent.nxy_offsets[i].dy;
	
				temp_obj.x = x + dx;
				temp_obj.y = y + dy;
				_parent.nxy.push(temp_obj);
			}
		}
	}

	function Filter(right, left, up, down){
		this.right = right;
		this.left = left;
		this.up = up;
		this.down = down;
	}
	
	this.useAtkinsonFilters = function(){
		var atkinson_right = new ErrorTechnique({name: 'atkinson_right',
							 nxy_offsets: [{dx: 1, dy: 0},
								       {dx: 2, dy: 0},
								       {dx: -1, dy: 1},
								       {dx: 0, dy: 1},
								       {dx: 1, dy: 1},
								       {dx: 0, dy: 2}],
							 weights: [1,1,1,1,1,1],
							 divisor: 3});

		var atkinson_left = new ErrorTechnique({name: 'atkinson_left', 
							nxy_offsets: [{dx:-1, dy: 0},
  								      {dx:-2, dy:0},
								      {dx:-1, dy: 1},
								      {dx:0, dy: 1},
								      {dx:1, dy: 1},
								      {dx:0, dy: 2}],
							weights: [1,1,1,1,1,1],
							divisor: 3});

		var atkinson_up = new ErrorTechnique({name: 'atkinson_up', 
					              nxy_offsets: [{dx:0, dy: -1},
  								      {dx:0, dy:-2},
								      {dx:1, dy: -1},
								      {dx:1, dy: 0},
								      {dx:1, dy:1},
								      {dx:2, dy: 0}],
						       weights: [1,1,1,1,1,1],
						       divisor: 3});

		var atkinson_down = new ErrorTechnique({name: 'atkinson_down',
							 nxy_offsets: [{dx: 0, dy: 1},
								       {dx: 0, dy: 2},
								       {dx: 1, dy: -1},
								       {dx: 1, dy: 0},
								       {dx: 1, dy: 1},
								       {dx: 2, dy: 0}],
							 weights: [1,1,1,1,1,1],
							 divisor: 3});

		_parent.img.filter = new Filter(atkinson_right, atkinson_left, atkinson_up, atkinson_down);
	};
	
	this.useSierraFilters = function(){
		var sierra_right = new ErrorTechnique({name: 'sierra_right', 
						       nxy_offsets: [{dx: 1, dy: 0},
                                                                     {dx: -1, dy: 1},
                                                                     {dx: 0, dy: 1}],
							weights: [2,1,1],
							divisor: 2});
		
		var sierra_left = new ErrorTechnique({name: 'sierra_left', 
						       nxy_offsets: [{dx: -1, dy: 0},
                                                                     {dx: 1, dy: 1},
                                                                     {dx: 0, dy: 1}],
							weights: [2,1,1],
							divisor: 2});

		var sierra_up = new ErrorTechnique({name: 'sierra_up', 
						       nxy_offsets: [{dx: 0, dy: -1},
                                                                     {dx: 1, dy: 1},
                                                                     {dx: 1, dy: 0}],
							weights: [2,1,1],
							divisor: 2});

		var sierra_down = new ErrorTechnique({name: 'sierra_down', 
						       nxy_offsets: [{dx: 0, dy: 1},
                                                                     {dx: 1, dy: 1},
                                                                     {dx: 1, dy: 0}],
							weights: [2,1,1],
							divisor: 2});
		_parent.img.filter = new Filter(sierra_right, sierra_left, sierra_up, sierra_down);
	};

	this.useFloydSteinbergFilters = function(){
		var fs_right = new ErrorTechnique({name:'fs_right',
                                                   nxy_offsets: [{dx: 1, dy: 0},
							         {dx:-1, dy: 1},  
							         {dx:0, dy: 1},  
							         {dx:1, dy: 1}],
						   weights: [7,3,5,1],
						   divisor: 4});

		var fs_left = new ErrorTechnique({name:'fs_left',
                                                   nxy_offsets: [{dx: -1, dy: 0},
							         {dx:1, dy: 1},  
							         {dx:0, dy: 1},  
							         {dx:-1, dy: 1}],
						   weights: [7,3,5,1],
						   divisor: 4});
		
		var fs_up = new ErrorTechnique({name:'fs_up',
                                                   nxy_offsets: [{dx: 0, dy: -1},
							         {dx:1, dy: 1},  
							         {dx:1, dy: 0},  
							         {dx:1, dy: -1}],
						   weights: [7,3,5,1],
						   divisor: 4});

		var fs_down = new ErrorTechnique({name:'fs_down',
                                                   nxy_offsets: [{dx: 0, dy: 1},
							         {dx:1, dy: -1},  
							         {dx:1, dy: 0},  
							         {dx:1, dy: 1}],
						   weights: [7,3,5,1],
						   divisor: 4});

		_parent.img.filter = new Filter(fs_right, fs_left, fs_up, fs_down);
	};

	function dither(imgData, img){
		var vertical_scan = img.vertical_scan;
		var raster = img.raster;
		var filter = img.filter;

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
			var em;
			if (vertical_scan){
				for (x = 0; x < w; x+=1){
					for(y = 0; y < h; y++){
						filter.down.setNXY(x,y);
						diffuseError(filter.down);
					}
				}
			} else {
				for(y = 0; y < h; y+=1){
					for (x = 0; x < w; x++){
						filter.right.setNXY(x,y);
						diffuseError(filter.right);
					}
				}
			}	
		}


		function serpentineScan(){
			var active_technique;
			if (vertical_scan){
				while (x < w){
					active_technique = (dy === 1) ? filter.down : filter.up;
					active_technique.setNXY(x,y);
					diffuseError(active_technique);
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
					active_technique = (dx === 1) ? filter.right : filter.left;
					active_technique.setNXY(x,y);
					diffuseError(active_technique);
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

		function diffuseError(error_technique){
				var nxy = error_technique.nxy;
				d_index = findDataIndex(x, y, w);	
				old_value = data[d_index];
				new_value = (old_value > 128) ? 255 : 0;
				data[d_index] = data[d_index + 1] = data[d_index + 2] = new_value;
				err = ((old_value - new_value) >> error_technique.divisor); 
				$.each(nxy, function(i, px){
					if (inBounds(px.x, px.y, w, h)){
						var o_index = findDataIndex(px.x, px.y, w);
						var val = data[o_index];
						data[o_index] = data[o_index + 1] = data[o_index + 2] = val + (err * error_technique.weights[i]);
					}
				});
		}


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

// private member function to find corresponding index within the imageData.data array 
// for a given pixel at coordinate (x,y);

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
