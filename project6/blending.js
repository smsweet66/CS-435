/**
 * Sean Sweet CS 435 Project 5
 * texmap.js is a program that creates a simple room (3 walls, a floor, a table,
 * and a tv).  Each part of the room has a different texture.  The tv can be turned on
 * to watch a video, which can be paused.  Using the previous and next buttons will
 * automatically pause the video, and will move the video to the previous or next frame
 * respectively.  The video can be resumed by clicking the pause/play button again.
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
	gl.enable(gl.DEPTH_TEST);   //closes surface gets drawn
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

	let frame = new Frame([50, 50], "frame4.png",5, 15, 2.5, 17.5);
	drawLoop();

	function drawLoop()
	{
		gl.clear(gl.COLOR_BUFFER_BIT);
		frame.draw();
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

class Picture
{
	static vertices = new Float32Array([
		0, 0,   0, 0,
		200, 0,  1, 0,
		200, 200, 1, 1,
		0, 200,  0, 1
	]);

	static vertexBuffer;

	texture;
	location;

	constructor(location, picture)
	{
		if(!Picture.vertexBuffer)
		{
			Picture.vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Picture.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Picture.vertices, gl.STATIC_DRAW);
		}

		let image = new Image();
		image.src = picture;
		let self = this;
		image.onload = function() { self.texture = generateTexture(image); }

		this.location = location;
	}
}

class Frame
{
	static frameVertices = new Float32Array([
		0, 0,   0, 0,
		200, 0,  1, 0,
		200, 200, 1, 1,
		0, 200,  0, 1
	]);

	static frameVB;

	pictureVertices;
	pictureVB;

	static frameTexture;
	location;

	constructor(location, frame, left, right, top, bottom)
	{
		if(!Frame.frameVB)
		{
			Frame.frameVB = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Frame.frameVB);
			gl.bufferData(gl.ARRAY_BUFFER, Frame.frameVertices, gl.STATIC_DRAW);
		}

		this.pictureVertices = new Float32Array([
			left, bottom,   0, 0,
			right, bottom,  1, 0,
			right, top,     1, 1,
			left, top,      0, 1
		]);

		let image = new Image();
		image.src = frame;
		let self = this;
		image.onload = function() { self.frameTexture = generateTexture(image); }

		this.location = location;
	}

	draw()
	{ drawElement(Frame.frameVB, this.frameTexture, translate(this.location[0], this.location[1], 0)); }

	drawWithPicture(location, picture)
	{
		drawElement(Frame.frameVB, this.frameTexture, translate(location[0], location[1], 0));
		drawElement(this.pictureVB, picture, translate(location[0], location[1], 0));
	}
}