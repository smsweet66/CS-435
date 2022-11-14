/**
 * Sean Sweet CS 435 Project 7
 *
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

	let frames = [
		new Frame([112, 212], "frame1.png", 60, 140, 150, 50),
		new Frame([312, 212], "frame2.png", 50, 150, 175, 25),
		new Frame([512, 212], "frame3.png", 50, 150, 175, 25),
		new Frame([712, 212], "frame4.png", 50, 150, 175, 25)
	]

	let pictures = [
		new Picture([112, 612], "picture1.jpg"),
		new Picture([312, 612], "picture2.webp"),
		new Picture([512, 612], "picture3.jpg"),
		new Picture([712, 612], "picture4.jpg")
	]

	let selectedFrame = 0;
	let selectedPicture = 0;

	drawLoop();

	const rect = canvas.getBoundingClientRect();
	let mouseLocation = [0, 0];
	//tells what should happen when the mouse is pressed down
	gl.canvas.addEventListener('mousedown', (e) => {
		//transforms raw mouse location to screen coordinates
		mouseLocation[0] = e.clientX - rect.left;
		mouseLocation[1] = rect.bottom - e.clientY;

		for(let i=0; i<frames.length; i++)
		{
			if(frames[i].isIn(mouseLocation))
			{
				selectedFrame = i;
				return;
			}
		}

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

class Camera
{
	static location;
	static theta;
	static phi;

	static rotate(dx, dy)
	{
		Camera.theta += dx;
		Camera.phi += dy;

		if(Camera.theta > 360)
			Camera.theta -= 360;
		else if(Camera.theta < 0)
			Camera.theta += 360;

		if(Camera.phi < -90)
			Camera.phi = -90;
		else if(Camera.phi > 90)
			Camera.phi = 90;
	}

	static move(delta)
	{
		for(let i=0; i<3; i++)
			Camera.location[i] += delta[i];
	}

	static getView()
	{
		let eye = vec3(Camera.location[0], Camera.location[1], Camera.location[2]);

		let direction = vec4(1, 0, 0, 0);
		direction = mult(rotateY(Camera.theta), direction);
		direction = mult(rotateX(Camera.phi), direction);

		let at = vec3(Camera.location[0] + direction[0], Camera.location[1] + direction[1], Camera.location[2] + direction[2]);
		return lookAt(eye, at, vec3(0, 1, 0));
	}
}

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