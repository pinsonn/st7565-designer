function Display(canvasID){

	this.el = document.getElementById(canvasID);
	this.ctx = this.el.getContext('2d');
	this.w = this.ctx.canvas.width;
	this.h = this.ctx.canvas.height;
	this.pixelSize = 10;
	this.brushSize = 1;
	this.rows = 7;
	this.cols = 5;
	this.ctx.lineWidth = 1;
	this.stateBuffer = [];
	this.previousStates = [];
	this.color = "black";
	this.numPages = Math.ceil(this.rows/8);
	this.lastPoint = {row: 0, col: 0};
	this.editable = false;
	this.showGrid = true;
	this.showEncoding = true;
	this.encodeAsBitmap = false;
	this.shiftIsDown = false;

	this.zeroBuffer = function(){

// set all bits in the stateBuffer to zero

		for (var i = 0; i < this.rows * this.cols; i++){
			this.stateBuffer[i] = 0;
		}
	},

	this.drawGrid = function(){

// draw the grid on the canvas 

		var s = this.pixelSize;
		var h_linecount = 0;
		if (this.showGrid){
			this.ctx.strokeStyle = "gray";

			for(i=s; i<this.w; i+=s){
				this.ctx.beginPath();
				this.ctx.moveTo(i, 0);
				this.ctx.lineTo(i, this.h);
				this.ctx.closePath();
				this.ctx.stroke();
			}

			for(var i=s; i<this.h; i+=s){
				this.ctx.strokeStyle = "gray";
				h_linecount += 1;
				if (h_linecount === 8) {
					h_linecount = 0;
					this.ctx.linewidth = 2;
					this.ctx.strokeStyle = "red";
				} 
				this.ctx.beginPath();
				this.ctx.moveTo(0, i);
				this.ctx.lineTo(this.w, i);
				this.ctx.closePath();
				this.ctx.stroke();
			}
		}
	},

	this.encode = function(){

// translate the bits in the buffer to 8bit hex values, organized in 8bit pages

		var col_values = [];
		var hex_string, binary_string;
		var i, j;

		for (i=0; i<this.cols; i++){
// slice off the each column of values
			binary_string = glcd.stateBuffer.slice(i*this.rows, (i*this.rows)+this.rows).join("");
			if(this.rows > 8){
// get the first 8 bits
				binary_string = binary_string.slice(0, 8);
			} else {
				while(binary_string.length < 8){
// pad with zeros if it's less than 8 bits in length
					binary_string += "0";
				}
			}
			if (this.encodeAsBitmap){
// reverse the bit order
				binary_string = binary_string.split("").reverse().join("");
			}
// translate to hex
			hex_string = parseInt(binary_string, 2).toString(16); 
			while(hex_string.length < 2){
// format the hex string to something usable in a sketch
				hex_string = "0" + hex_string;
			}
// push to the output array
			col_values.push("0x" + hex_string + ",");
		}

// repeat the above for each page (set of 8 rows)

		if (this.numPages > 1){
			for (j=1; j<this.numPages; j++){
				col_values.push("<br/><br/>");
				for (i=0; i<this.cols; i++){

					binary_string = glcd.stateBuffer.slice(i*this.rows, (i*this.rows) + this.rows).join("");
					binary_string = binary_string.slice(8*j, 8*j + 8);
					while(binary_string.length < 8){
						binary_string += "0";
					}

					if (this.encodeAsBitmap){
						binary_string = binary_string.split("").reverse().join("");
					}

					hex_string = parseInt(binary_string, 2).toString(16); 
					while(hex_string.length < 2){
						hex_string = "0" + hex_string;
					}
					col_values.push("0x" + hex_string + ",");
				}
			}
		}

// return a string of all hex values

		return col_values.join(" ");
	},

	this.drawPixel = function(evt){
		var s = this.pixelSize;

// play nice with firefox

		var offsetX = evt.pageX - this.el.offsetLeft;
		var offsetY = evt.pageY - this.el.offsetTop;

// pixelValue will turn the bit in the stateBuffer on or off depending on which color is selected

		var pixelValue = (this.color === 'black') ? 1 : 0;
		var col = Math.floor(offsetX / s);
		var row = Math.floor(offsetY / s);
		row = (row >= this.rows) ? this.rows - 1 : row;
		var start_x = col * s;
		var start_y = row * s;
		var i, j; // used for brushes

//. the rest of the variables are used in the bresenham's routine

		var x0, y0, x1, y1;
		var dx, dy, err;
		var swap_obj = {};
		var x, y, ystep;

		x0 = this.lastPoint.col;
		y0 = this.lastPoint.row;
		x1 = col;
		y1 = row;
			
		steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
		
		if (this.shiftIsDown){

// if shift key is held down, use generalized form of bresenham's line algorithm to set bits representing
//  a line to second point

			if (steep){
				swap_obj = {a: x0, b: y0};
				x0 = swap_obj.b;
				y0 = swap_obj.a;

				swap_obj = {a: x1, b: y1};
				x1 = swap_obj.b;
				y1 = swap_obj.a;
			}						

			if (x0 > x1){
				swap_obj = {a: x0, b: x1};
				x0 = swap_obj.b;
				x1 = swap_obj.a;

				swap_obj = {a: y0, b: y1};
				y0 = swap_obj.b;
				y1 = swap_obj.a;
			}
			
			dx = x1 - x0;
			dy = Math.abs(y1 - y0);
			err = dx/2;
			y = y0;
			ystep = (y0 < y1) ? 1 : -1;
			for (x = x0; x<=x1; x++){
				if (steep){

// set bits for pixel, take into account the brush size

					for(j=0; j < this.brushSize; j++){
						for(i=0; i < this.brushSize; i++){
								this.stateBuffer[x + ((y + j)*this.rows) + i] = pixelValue;
						}
					}
					
				} else {
					for(j=0; j < this.brushSize; j++){
						for(i=0; i < this.brushSize; i++){
								this.stateBuffer[y + ((x + j)*this.rows) + i] = pixelValue;
						}
					}
	
				}
				err = err - dy;
				if (err < 0){
					y = y + ystep;
					err = err + dx
				}
			}
		} else {

// shift key isn't held down, so just set bits for all pixels covered by a square of the set brush size
 
			for(j=0; j < this.brushSize; j++){

// if on the last row, don't overflow to the next column

				if (row === (this.rows - 1)){
					this.stateBuffer[row + ((col + j)*this.rows)] = pixelValue;
				} else {

// not on the last row, so set bits for the whole square

					for(i=0; i < this.brushSize; i++){
						this.stateBuffer[row + ((col + j)*this.rows) + i] = pixelValue;
					}
				}
			}
		}

// now render the bit array on the canvas

		this.drawBuffer();

		this.lastPoint.row = row;
		this.lastPoint.col = col;
	}, 

	this.drawBuffer = function(){

// renders the bit array on the canvas 

		var buffer = this.stateBuffer;
		var s = this.pixelSize;
		var i, j;

		this.ctx.clearRect(0,0,this.w,this.h);
		this.ctx.fillStyle = "black";
		this.ctx.clearRect(0,0,this.w, this.h);
		for(i=0; i<this.cols; i++){
			for(j=0; j<this.rows; j++){
				if (buffer[j + i*this.rows]){
					this.ctx.beginPath();
					this.ctx.rect(i*s, j*s, s, s);
					this.ctx.closePath();
					this.ctx.fill();
				}
			}
		}

// draw the grid over the top

		this.drawGrid();
	},

	this.clear = function(){

// clears the canvas, redraws the grid, and zeros the buffer

		this.ctx.clearRect(0,0,this.w,this.h);
		this.drawGrid();
		this.zeroBuffer();
	}, 

	this.saveItem = function(){
		var saveObj;
// save item to local storage
		try{
			savedItems = JSON.parse(localStorage['items']);
		} catch(err) {
			savedItems = {};
		}

		if (savedItems === null){
			savedItems = {};
		}

		saveObj = {bits: this.stateBuffer,
			       thumbnailURL: this.el.toDataURL(), 
			       rows: this.rows, 
			       cols: this.cols};
		savedItems[Date.now()] = saveObj;
		localStorage['items'] = JSON.stringify(savedItems);
	},

	this.deleteItem = function(key){

// delete an item from local storage
		
		var items = JSON.parse(localStorage['items']);
		delete items[key];
		localStorage['items'] = JSON.stringify(items);
		this.loadSavedItems();
	},

	this.restoreItem = function(key){

// pull item from local storage and draw to canvas
		var items = JSON.parse(localStorage['items']);
		var o = items[key]; //JSON.parse(localStorage[key]);
		this.rows = o.rows;
		this.cols = o.cols;
		this.stateBuffer = o.bits;
		this.resizeCanvas();
		this.numPages = Math.ceil(this.rows/8);
		this.drawBuffer();
	},

	this.resizeCanvas = function(){

// resize the canvas

		this.ctx.canvas.height = glcd.rows * glcd.pixelSize;
		this.ctx.canvas.width = glcd.cols * glcd.pixelSize;
		this.h = glcd.ctx.canvas.height;
		this.w = glcd.ctx.canvas.width;
	}, 

	this.loadSavedItems = function(){

// load all the items from local storage. This is the only method that manipulates the DOM directly, making it not so portable.
// Need to address this. 

		var max_dim = 75;
		var items, o, key, img, ar, wider, new_el, id;

// get an array of keys in localStorage, then sort from newest to oldest

		keys = [];
		items = JSON.parse(localStorage['items']);
		for (key in items){
			keys.push(key);
		}
		keys.sort(function(a,b){return b-a});

// make an asynchronous loop. Loop should only increment to next step 
// when the img src is successfully loaded

		var i = 0;
		this._asyncLoop(keys.length, function(loop){
			key = keys[i]; //localStorage.key(i);
			o = items[key]; //JSON.parse(localStorage[key]);
			img = new Image();
		
			img.src = o.thumbnailURL;
			img.onload = function(){
				ar = img.width / img.height;
				wider = (img.width > img.height);
				if (wider){
					img.width = max_dim;
					img.height = img.width / ar;
				} else {
					img.height = max_dim;
					img.width = img.height * ar;
				}	


				new_el = $('<div></div>').attr({'class': 'savedItem', 
                                                                'id' : key});
				new_el.append(img);
				new_el.append('<div><span class="button editBtn">Edit</span>&nbsp;|&nbsp;<span class="button deleteBtn">Delete</span></div>');
				$('#savedItems').append(new_el);
				loop.next();
			}
			i += 1;
		});
	},

	this.loadFromFile = function(fileList){
		var items, o;
		var reader = new FileReader();
		var f = fileList[0]; // just read the first file in the list
		objRef = this;
		reader.onload = function(e){
				var contents = e.target.result;
				
				try {
					o = JSON.parse(contents);
					o = JSON.parse(o);
					for (key in o){
						var firstkey = key;
						break;
					}
					if (o[firstkey].bits && o[firstkey].rows && o[firstkey].cols){		
						localStorage.clear();
						localStorage['items'] = JSON.stringify(o);
						objRef.loadSavedItems();
					} else {
						throw "contentErr";
					}
				} catch(err){
					console.log(err);
					if (err === "contentErr"){
						alert("Invalid object structure in file. Can't build a saved items list from this file.");
					} else {
						alert('File does not contain a parsable JSON object.');
					}
					}
				};

		if (f.type !== "text/plain"){
			alert("You can only import from plain text (.txt) files.");
		} else {
				reader.readAsText(f); 
		}	
	}, 

	this.exportSavedItems = function(){
		return JSON.stringify(localStorage['items']);
	},

	this._asyncLoop = function (iterations, func) {
	    var index = 0;
	    var done = false;
	    var loop = {
		next: function() {
		    if (done) {
			return;
		    }

		    if (index < iterations) {
			index++;
			func(loop);
		    } else {
			done = true;
		    }
		},

		iteration: function() {
		    return index - 1;
		},

		break: function() {
		    done = true;
		}
	    };
	    loop.next();
	    return loop;
	}
}
