/**
 * Sean Sweet CS 435 Project 4
 * spotlight.js is a program that creates a stage and shines a light on it.
 * The light's location is fixed, but it is able to point in different directions.
 * Additionally, the viewer can also move to different predetermined positions.
 */

let gl;

let u_model;

let u_view;
let viewMatrix;

let u_projection;
let projectionMatrix;

let u_texture;

let copyVideo = false;
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

	u_view = gl.getUniformLocation(program, "u_view");
	viewMatrix = lookAt(vec3(0, 2, 10), vec3(0, 2, 0), vec3(0, 1, 0));

	//changes the coordinates to pixel width and height
	u_projection = gl.getUniformLocation(program, "u_projection");
	projectionMatrix = perspective(45, 1, 1, -1);

	//sets texture
	u_texture = gl.getUniformLocation(program, "u_texture");

	let room = new Room();
	requestAnimationFrame(drawRoom);

	window.addEventListener("keydown", (e) => {
		switch(e.key)
		{
		case " ":
			if(paused)
				TV.screenVideo1.play();
			else
				TV.screenVideo1.pause();

			paused = !paused;
			break;
		default:
			break;
		}
	});

	//drawing loop that takes the rotation of the sign as an argument
	function drawRoom()
	{
		room.draw();

		requestAnimationFrame(drawRoom);
	}
};

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

function updateVideoTexture(texture, video)
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
}

function generateVideo(file)
{
	const video = document.createElement("video");

	let playing = false;
	let timeupdate = false;

	video.playsInline = true;
	video.muted = false;
	video.loop = true;

	// Waiting for these 2 events ensures
	// there is data in the video

	video.addEventListener("playing", function() {
		playing = true;
		checkReady();
	}, true);

	video.addEventListener("timeupdate", function() {
		timeupdate = true;
		checkReady();
	}, true);

	video.src = file;
	video.play();

	function checkReady() {
		if (playing && timeupdate) {
			copyVideo = true;
		}
	}

	return video;
}

class TV
{
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
	static screenTexture;
	static screenVideo1;

	modelMatrix;

	constructor(location, theta)
	{
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

			let image = new Image();
			image.src = "grey_square.png";
			image.onload = function() { TV.TVTexture = generateTexture(image); }

			TV.screenTexture = initVideoTexture();
			TV.screenVideo1 = generateVideo("static.mp4");
		}

		this.modelMatrix = rotateY(theta);
		this.modelMatrix = mult(translate(location[0], location[1], location[2]), this.modelMatrix);
	}

	draw()
	{
		drawElement(TV.TVVertexBuffer, TV.TVIndexBuffer, TV.TVIndices.length, TV.TVTexture, this.modelMatrix);

		if(copyVideo)
			updateVideoTexture(TV.screenTexture, TV.screenVideo1);

		drawElement(TV.screenVertexBuffer, TV.screenIndexBuffer, TV.screenIndices.length, TV.screenTexture, this.modelMatrix);
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

	static texture;

	location;

	constructor(location)
	{
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
		let modelMatrix = translate(this.location[0], this.location[1], this.location[2]);
		drawElement(Table.tableTopVertexBuffer, Table.tableTopIndexBuffer, Table.tableTopIndices.length, Table.texture, modelMatrix);

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

	constructor(location, theta)
	{
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

		this.modelMatrix = rotateY(theta);
		this.modelMatrix = mult(translate(location[0], location[1], location[2]), this.modelMatrix);
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

		this.floor = new Floor([0, 0, 0], 0);
		this.table = new Table([0, 0, -1.5], 0);
		this.tv    = new TV([0, 1, -1.5], 0);
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