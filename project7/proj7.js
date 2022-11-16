/**
 * Sean Sweet CS 435 Project 7
 *
 */

//opengl context
let gl;

//model matrix uniform location
let u_model;

//view matrix uniform location
let u_view;

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

	//uniform location for view matrix (used for camera)
	u_view = gl.getUniformLocation(program, "u_view");

	//sets the perspective projection
	u_projection = gl.getUniformLocation(program, "u_projection");
	projectionMatrix = perspective(45, 1, 1, -1);

	//sets texture uniform location
	u_texture = gl.getUniformLocation(program, "u_texture");

	let picture = new Object(
		new Float32Array([
			0, 0,   0, 0,
			1, 0,  1, 0,
			1, 1, 1, 1,
			0, 1,  0, 1
		]),
		"frame1.png"
	);

	picture.addInstance([0, 0, -5]);

	window.addEventListener('keydown', (e) => {
		switch(e.key)
		{
		case "a":
			 Camera.move([-.5, 0, 0]);
			 break;
		case "d":
			Camera.move([.5, 0, 0]);
			break;
		default:
			break;
		}
	});

	const rect = canvas.getBoundingClientRect();
	let mouseLocation = [0, 0];
	let oldMouseLocation = [mouseLocation[0], mouseLocation[1]];

	window.addEventListener('mousemove', (e) => {
		mouseLocation[0] = e.clientX - rect.left;
		mouseLocation[1] = rect.bottom - e.clientY;

		Camera.rotate((oldMouseLocation[0] - mouseLocation[0])/75, (oldMouseLocation[1] - mouseLocation[1])/75);
		oldMouseLocation = [mouseLocation[0], mouseLocation[1]];
	})

	drawLoop();

	function drawLoop()
	{
		gl.clear(gl.COLOR_BUFFER_BIT);

		picture.draw();

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
	gl.uniformMatrix4fv(u_view, false, flatten(Camera.getView()));
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
	static location = [0, 0, 0];
	static theta = 0;
	static phi = 0;

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

		let direction = vec4(0, 0, -1, 0);
		direction = mult(rotateY(Camera.theta), direction);
		direction = mult(rotateX(Camera.phi), direction);

		let at = vec3(Camera.location[0] + direction[0], Camera.location[1] + direction[1], Camera.location[2] + direction[2]);
		return lookAt(eye, at, vec3(0, 1, 0));
	}
}

class Object
{
	vertices;
	vertexBuffer;
	texture;
	location;

	constructor(vertices, texture)
	{
		this.vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		let image = new Image();
		image.src = texture;
		let self = this;
		image.onload = function() { self.texture = generateTexture(image); }

		this.location = [];
	}

	addInstance(location)
	{ this.location.push(location); }

	draw()
	{ this.location.forEach((location) => drawElement(this.vertexBuffer, this.texture, translate(...location))); }
}