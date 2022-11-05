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

//view matrix and its uniform location
let u_view;
let viewMatrix;

//projection matrix and its uniform location
let u_projection;
let projectionMatrix;

//texture uniform location
let u_texture;

let power = false;
let paused = false;

window.onload = function init()
{
	const canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext('webgl2');
	if(!gl)
		alert("WebGL 2.0 isn't available");

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.7, 0.7, 0.7, 1.0);
	gl.enable(gl.DEPTH_TEST);   //closes surface gets drawn
	gl.enable(gl.CULL_FACE);

	const program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	//uniform location for model matrix (used to translate the base car location)
	u_model = gl.getUniformLocation(program, "u_model");

	//sets the camera location and orientation
	u_view = gl.getUniformLocation(program, "u_view");
	viewMatrix = lookAt(vec3(0, 2, 10), vec3(0, 2, 0), vec3(0, 1, 0));

	//sets the perspective projection
	u_projection = gl.getUniformLocation(program, "u_projection");
	projectionMatrix = perspective(45, 1, 1, -1);

	//sets texture uniform location
	u_texture = gl.getUniformLocation(program, "u_texture");

	let room = new Room();
	requestAnimationFrame(drawRoom);

	const powerButton = document.getElementById("power");
	const playButton = document.getElementById("play");
	const previousButton = document.getElementById("previous");
	const nextButton = document.getElementById("next");

	//changes power state on click
	powerButton.onclick = function()
	{
		power = !power;

		paused = false;
		TV.screenVideo.play()
		TV.screenVideo.muted = !power;
	}

	//pauses/unpauses on click if tv is on
	playButton.onclick = function()
	{
		if(power)
		{
			paused = !paused;

			if(paused)
				TV.screenVideo.pause();
			else
				TV.screenVideo.play();
		}
	}

	//pauses the video and moves to the previous frame in video
	previousButton.onclick = function()
	{
		if(power)
		{
			paused = true;
			TV.screenVideo.pause();

			TV.screenVideo.currentTime -= 1/30;
		}
	}

	//pauses the video and moves to the next frame in video
	nextButton.onclick = function()
	{
		if(power)
		{
			paused = true;
			TV.screenVideo.pause();

			TV.screenVideo.currentTime += 1/30;
		}
	}

	//drawing loop
	function drawRoom()
	{
		room.draw();
		requestAnimationFrame(drawRoom);
	}
};

//basic drawing function used for every object in the room
function drawElement(vertexBuffer, indexBuffer, length, texture, modelMatrix)
{
	//bind buffers
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	//set uniforms
	gl.uniformMatrix4fv(u_model, false, flatten(modelMatrix));
	gl.uniformMatrix4fv(u_view, false, flatten(viewMatrix));
	gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
	gl.uniform1i(u_texture, 0);

	//set attributes
	gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);

	//enable attributes
	gl.enableVertexAttribArray(0);
	gl.enableVertexAttribArray(1);

	//draw triangles
	gl.drawElements(gl.TRIANGLES, length, gl.UNSIGNED_BYTE, 0);
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

//sets up a texture object used for videos
function initVideoTexture()
{
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Because video has to be download over the internet
	// they might take a moment until it's ready so
	// put a single pixel in the texture, so we can
	// use it immediately.
	const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

	// Turn off mips and set  wrapping to clamp to edge, so it
	// will work regardless of the dimensions of the video.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	return texture;
}

//updates the texture to the next frame of the video
function updateVideoTexture(texture, video)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
}

//adds a video element to the html
function generateVideo(file)
{
	const video = document.createElement("video");

	video.playsInline = true;
	video.muted = true;
	video.loop = true;
	video.src = file;

	video.play();

	return video;
}

class TV
{
	//tv case vertices
	static TVVertices = new Float32Array([
		-0.5, 0, 0.5,       1, 0,
		0.5, 0, 0.5,        0, 0,
		0.4, 0, -0.5,       0, 1,
		-0.4, 0, -0.5,      1, 1,

		-0.5, 0.9, 0.5,     0, 0,
		0.5, 0.9, 0.5,      1, 0,
		0.4, 0.9, -0.5,     1, 1,
		-0.4, 0.9, -0.5,    0, 1
	]);

	static TVIndices = new Uint8Array([
		2, 1, 0,
		3, 2, 0,
		5, 6, 4,
		6, 7, 4,

		1, 5, 0,
		5, 4, 0,
		2, 6, 1,
		6, 5, 1,
		3, 7, 2,
		7, 6, 2,
		0, 4, 3,
		4, 7, 3
	]);

	//tv screen vertices
	static screenVertitces = new Float32Array([
		-0.4, 0.1, 0.51, 0, 0,
		0.4, 0.1, 0.51,  1, 0,
		0.4, 0.8, 0.51,  1, 1,
		-0.4, 0.8, 0.51, 0, 1
	]);

	static screenIndices = new Uint8Array([
		1, 2, 0,
		2, 3, 0
	]);

	static TVVertexBuffer;
	static TVIndexBuffer;
	static TVTexture

	static screenVertexBuffer;
	static screenIndexBuffer;
	static screenTexture;       //used when tv is off
	static screenVideo;         //video object
	static screenVideoTexture;  //texture for when video is playing on screen

	modelMatrix;

	constructor(location)
	{
		//initial setup of static data
		if(!TV.TVVertexBuffer)
		{
			TV.TVVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, TV.TVVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, TV.TVVertices, gl.STATIC_DRAW);

			TV.TVIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TV.TVIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, TV.TVIndices, gl.STATIC_DRAW);

			TV.screenVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, TV.screenVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, TV.screenVertitces, gl.STATIC_DRAW);

			TV.screenIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TV.screenIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, TV.screenIndices, gl.STATIC_DRAW);

			//loads tv case texture
			let image1 = new Image();
			image1.src = "grey_square.png";
			image1.onload = function() { TV.TVTexture = generateTexture(image1); }

			//loads blank tv screen texture
			let image2 = new Image();
			image2.src = "black_square.jpg";
			image2.onload = function() { TV.screenTexture = generateTexture(image2); }

			TV.screenVideoTexture = initVideoTexture();
			TV.screenVideo = generateVideo("Courage.mp4");
		}

		this.modelMatrix = translate(location[0], location[1], location[2]);
	}

	draw()
	{
		//draws the case
		drawElement(TV.TVVertexBuffer, TV.TVIndexBuffer, TV.TVIndices.length, TV.TVTexture, this.modelMatrix);

		//draws the screen
		if(power)
		{
			updateVideoTexture(TV.screenVideoTexture, TV.screenVideo);
			drawElement(TV.screenVertexBuffer, TV.screenIndexBuffer, TV.screenIndices.length, TV.screenVideoTexture, this.modelMatrix);
		}
		else
			drawElement(TV.screenVertexBuffer, TV.screenIndexBuffer, TV.screenIndices.length, TV.screenTexture, this.modelMatrix)
	}
}

class Table
{
	static tableTopVertices = new Float32Array([
		-1, 0.9, 1,     1, 0,
		1, 0.9, 1,      0, 0,
		1, 0.9, -1,     0, 1,
		-1, 0.9, -1,    1, 1,

		-1, 1, 1,       0, 0,
		1, 1, 1,        1, 0,
		1, 1, -1,       1, 1,
		-1, 1, -1,      0, 1,
	]);

	static tableTopIndices =  new Uint8Array([
		2, 1, 0,
		3, 2, 0,
		5, 6, 4,
		6, 7, 4,

		1, 5, 0,
		5, 4, 0,
		2, 6, 1,
		6, 5, 1,
		3, 7, 2,
		7, 6, 2,
		0, 4, 3,
		4, 7, 3
	]);

	static legVertices = new Float32Array([
		-0.05, 0, 0.05,     0.05, 0,
		0.05, 0, 0.05,      0, 0,
		0.05, 0, -0.05,     0, 0.05,
		-0.05, 0, -0.05,    0.05, 0.05,

		-0.05, 0.9, 0.05,     0, 0,
		0.05, 0.9, 0.05,      0.05, 0,
		0.05, 0.9, -0.05,     0.05, 0.05,
		-0.05, 0.9, -0.05,    0, 0.05,
	]);

	static legIndices = new Uint8Array([
		2, 1, 0,
		3, 2, 0,
		5, 6, 4,
		6, 7, 4,

		1, 5, 0,
		5, 4, 0,
		2, 6, 1,
		6, 5, 1,
		3, 7, 2,
		7, 6, 2,
		0, 4, 3,
		4, 7, 3
	]);

	static tableTopVertexBuffer;
	static tableTopIndexBuffer;
	static legVertexBuffer;
	static legIndexBuffer;

	static texture; //texture used for whole table

	location;

	constructor(location)
	{
		//initial setup of static data
		if(!Table.tableTopVertexBuffer)
		{
			Table.tableTopVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Table.tableTopVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Table.tableTopVertices, gl.STATIC_DRAW);

			Table.tableTopIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Table.tableTopIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Table.tableTopIndices, gl.STATIC_DRAW);

			Table.legVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Table.legVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Table.legVertices, gl.STATIC_DRAW);

			Table.legIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Table.legIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Table.legIndices, gl.STATIC_DRAW);

			let image = new Image();
			image.src = "wood.jpg";
			image.onload = function() { Table.texture = generateTexture(image); }
		}

		this.location = location;
	}

	draw()
	{
		//draws top of table
		let modelMatrix = translate(this.location[0], this.location[1], this.location[2]);
		drawElement(Table.tableTopVertexBuffer, Table.tableTopIndexBuffer, Table.tableTopIndices.length, Table.texture, modelMatrix);

		//draws each leg of the table
		modelMatrix = translate(this.location[0] - 0.95, this.location[1], this.location[2] + 0.95);
		drawElement(Table.legVertexBuffer, Table.legIndexBuffer, Table.legIndices.length, Table.texture, modelMatrix);

		modelMatrix = translate(this.location[0] + 0.95, this.location[1], this.location[2] + 0.95);
		drawElement(Table.legVertexBuffer, Table.legIndexBuffer, Table.legIndices.length, Table.texture, modelMatrix);

		modelMatrix = translate(this.location[0] + 0.95, this.location[1], this.location[2] - 0.95);
		drawElement(Table.legVertexBuffer, Table.legIndexBuffer, Table.legIndices.length, Table.texture, modelMatrix);

		modelMatrix = translate(this.location[0] - 0.95, this.location[1], this.location[2] - 0.95);
		drawElement(Table.legVertexBuffer, Table.legIndexBuffer, Table.legIndices.length, Table.texture, modelMatrix);
	}
}

class Wall
{
	static vertices = new Float32Array([
		-2.5, 0, 0, 0, 0,
		2.5, 0, 0,  1, 0,
		2.5, 5, 0,  1, 1,
		-2.5, 5, 0, 0, 1
	]);

	static indices = new Uint8Array([
		1, 2, 0,
		2, 3, 0
	]);

	static vertexBuffer;
	static indexBuffer;

	static texture;

	modelMatrix;

	constructor(location, theta)
	{
		//initial setup of static data
		if(!Wall.vertexBuffer)
		{
			Wall.vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Wall.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Wall.vertices, gl.STATIC_DRAW);

			Wall.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Wall.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Wall.indices, gl.STATIC_DRAW);

			let image = new Image();
			image.src = "brick_wall.jpg";
			image.onload = function() { Wall.texture = generateTexture(image); }
		}

		this.modelMatrix = rotateY(theta);
		this.modelMatrix = mult(translate(location[0], location[1], location[2]), this.modelMatrix);
	}

	draw()
	{ drawElement(Wall.vertexBuffer, Wall.indexBuffer, Wall.indices.length, Wall.texture, this.modelMatrix); }
}

class Floor
{
	static vertices = new Float32Array([
		-2.5, 0, 2.5, 0, 0,
		2.5, 0, 2.5,  1, 0,
		2.5, 0, -2.5,  1, 1,
		-2.5, 0, -2.5, 0, 1
	]);

	static indices = new Uint8Array([
		1, 2, 0,
		2, 3, 0
	]);

	static vertexBuffer;
	static indexBuffer;

	static texture;

	modelMatrix;

	constructor(location)
	{
		//initial setup of static data
		if(!Floor.vertexBuffer)
		{
			Floor.vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Floor.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Floor.vertices, gl.STATIC_DRAW);

			Floor.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Floor.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Floor.indices, gl.STATIC_DRAW);

			let image = new Image();
			image.src = "carpet.jpeg";
			image.onload = function() { Floor.texture = generateTexture(image); }
		}

		this.modelMatrix = translate(location[0], location[1], location[2]);
	}

	draw()
	{ drawElement(Floor.vertexBuffer, Floor.indexBuffer, Floor.indices.length, Floor.texture, this.modelMatrix); }
}

class Room
{
	walls;
	floor;
	table;
	tv;

	constructor()
	{
		this.walls = [
			new Wall([0, 0, -2.5], 0),
			new Wall([-2.5, 0, 0], 90),
			new Wall([2.5, 0, 0], -90)
		];

		this.floor = new Floor([0, 0, 0]);
		this.table = new Table([0, 0, -1.5]);
		this.tv    = new TV([0, 1, -1.5]);
	}

	draw()
	{
		gl.clear(gl.COLOR_BUFFER_BIT);
		for(let i=0; i<this.walls.length; i++)
			this.walls[i].draw();

		this.floor.draw();
		this.table.draw();
		this.tv.draw();
	}
}