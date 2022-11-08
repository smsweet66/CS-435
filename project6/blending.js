/**
 * Sean Sweet CS 435 Project 5
 * Blending.js is a program that displays a row of different pictures and a row of different frames.
 * Between the two rows is a frame with a picture inside it.  Clicking any of the pictures will put that
 * picture within the center frame, and clicking any frame, will replace the center frame with the frame
 * that was clicked.  The picture is drawn behind the frame, but is still visible due to blending using
 * alpha values.
 */

//opengl context
let gl;

//model matrix uniform location
let u_model;

//projection matrix and its uniform location
let u_projection;
let projectionMatrix;

//texture uniform location
let u_texture;

window.onload = function init()
{
	const canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext('webgl2');
	if(!gl)
		alert("WebGL 2.0 isn't available");

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.7, 0.7, 0.7, 1.0);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	const program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	//uniform location for model matrix (used to translate the base car location)
	u_model = gl.getUniformLocation(program, "u_model");

	//sets the perspective projection
	u_projection = gl.getUniformLocation(program, "u_projection");
	projectionMatrix = ortho(0, canvas.width, 0, canvas.height, 1, -1);

	//sets texture uniform location
	u_texture = gl.getUniformLocation(program, "u_texture");

	//array containing the picture frames
	let frames = [
		new Frame([112, 212], "frame1.png", 60, 140, 150, 50),
		new Frame([312, 212], "frame2.png", 50, 150, 175, 25),
		new Frame([512, 212], "frame3.png", 50, 150, 175, 25),
		new Frame([712, 212], "frame4.png", 50, 150, 175, 25)
	]

	//array containing the pictures
	let pictures = [
		new Picture([112, 612], "picture1.jpg"),
		new Picture([312, 612], "picture2.webp"),
		new Picture([512, 612], "picture3.jpg"),
		new Picture([712, 612], "picture4.jpg")
	]

	let selectedFrame = 0;      //index of selected frame
	let selectedPicture = 0;    //index of selected picture

	drawLoop();

	//tells what should happen when the mouse is pressed down
	gl.canvas.addEventListener('mousedown', (e) => {
		//transforms raw mouse location to screen coordinates
		const rect = canvas.getBoundingClientRect();
		let mouseLocation = [0, 0];
		mouseLocation[0] = e.clientX - rect.left;
		mouseLocation[1] = rect.bottom - e.clientY;

		//check for clicked frame
		for(let i=0; i<frames.length; i++)
		{
			if(frames[i].isIn(mouseLocation))
			{
				selectedFrame = i;
				return;
			}
		}

		//check for clicked picture
		for(let i=0; i<pictures.length; i++)
		{
			if(pictures[i].isIn(mouseLocation))
			{
				selectedPicture = i;
				return;
			}
		}
	});

	function drawLoop()
	{
		gl.clear(gl.COLOR_BUFFER_BIT);
		for(let i=0; i<4; i++)
		{
			frames[i].draw();
			pictures[i].draw();
		}

		frames[selectedFrame].drawWithPicture([412, 412], pictures[selectedPicture].texture);
		requestAnimationFrame(drawLoop);
	}
};

//basic drawing function used for every object in the room
function drawElement(vertexBuffer, texture, modelMatrix)
{
	//bind buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	//set uniforms
	gl.uniformMatrix4fv(u_model, false, flatten(modelMatrix));
	gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
	gl.uniform1i(u_texture, 0);

	//set attributes
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

	//enable attributes
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);

	//draw triangles
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

//generates a static texture object
function generateTexture(image)
{
	let texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

	return texture;
}

//basic object class that contains vertex buffer, texture object, and location of object
class Object
{
	vertexBuffer;
	texture;
	location;

	constructor(location, picture, vertices)
	{
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		let image = new Image();
		image.src = picture;
		let self = this;
		image.onload = function() { self.texture = generateTexture(image); }

		this.location = location;
	}

	draw()
	{ drawElement(this.vertexBuffer, this.texture, translate(this.location[0], this.location[1], 0)); }
}

//information for standalone picture object (not drawn in frame)
class Picture extends Object
{
	static vertices = new Float32Array([
		0, 0,   0, 0,
		200, 0,  1, 0,
		200, 200, 1, 1,
		0, 200,  0, 1
	]);

	constructor(location, picture)
	{ super(location, picture, Picture.vertices); }

	//checks if given x, y location is whithin frame
	isIn(location)
	{
		for(let i=0; i<4; i++)
		{
			let v1 = vec3(Picture.vertices[((i+1)*4)%16] - Picture.vertices[i*4], Picture.vertices[(i+1)*4%16 + 1] - Picture.vertices[i*4 + 1], 0);
			let v2 = vec3(location[0] - Picture.vertices[(i+1)*4%16] - this.location[0], location[1] - Picture.vertices[(i+1)*4%16 + 1] - this.location[1], 0);
			if(cross(v1, v2)[2] < 0)
				return false;
		}

		return true;
	}
}

//information for frame
class Frame extends Object
{
	static vertices = new Float32Array([
		0, 0,   0, 0,
		200, 0,  1, 0,
		200, 200, 1, 1,
		0, 200,  0, 1
	]);

	pictureVertices;
	pictureVB;

	constructor(location, frame, left, right, top, bottom)
	{
		super(location, frame, Frame.vertices);

		//constructs vertices for picture in frame
		this.pictureVertices = new Float32Array([
			left, bottom,   0, 0,
			right, bottom,  1, 0,
			right, top,     1, 1,
			left, top,      0, 1
		]);

		this.pictureVB = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pictureVB);
		gl.bufferData(gl.ARRAY_BUFFER, this.pictureVertices, gl.STATIC_DRAW);
	}

	drawWithPicture(location, picture)
	{
		drawElement(this.pictureVB, picture, translate(location[0], location[1], 0));
		drawElement(this.vertexBuffer, this.texture, translate(location[0], location[1], 0));
	}

	//checks if given x, y location is whithin the frame
	isIn(location)
	{
		for(let i=0; i<4; i++)
		{
			let v1 = vec3(Frame.vertices[((i+1)*4)%16] - Frame.vertices[i*4], Frame.vertices[(i+1)*4%16 + 1] - Frame.vertices[i*4 + 1], 0);
			let v2 = vec3(location[0] - Frame.vertices[(i+1)*4%16] - this.location[0], location[1] - Frame.vertices[(i+1)*4%16 + 1] - this.location[1], 0);
			if(cross(v1, v2)[2] < 0)
				return false;
		}

		return true;
	}
}