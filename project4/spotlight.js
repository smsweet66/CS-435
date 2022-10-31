/**
 * Sean Sweet CS 435 Project 4
 * spotlight.js is a program that creates a stage and shines a light on it.
 * The light's location is fixed, but it is able to point in different directions.
 * Additionally, the viewer can also move to different predetermined positions.
 */

let gl;

let u_view;
let viewMatrix;

let u_projection;
let projectionMatrix;

let u_spotlightLoc;
let spotlightLoc;

let u_cutoffAngle;

window.onload = function init()
{
	const canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext('webgl2');
	if(!gl)
		alert("WebGL 2.0 isn't available");

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.7, 0.7, 0.7, 1.0);
	gl.enable(gl.DEPTH_TEST);   //closes surface gets drawn

	const program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	//uniform location for model matrix (used to translate the base car location)
	u_model = gl.getUniformLocation(program, "u_model");

	u_view = gl.getUniformLocation(program, "u_view");
	viewMatrix = lookAt(vec3(-40, 40, -16.5), vec3(10 - 1.464161, 5, 3.5355339), vec3(0, 1, 0));

	//changes the coordinates to pixel width and height
	u_projection = gl.getUniformLocation(program, "u_projection");
	projectionMatrix = perspective(45, 1, 1, -1);

	//sets the point at which the spotlight shines
	u_spotlightLoc = gl.getUniformLocation(program, "u_spotlightLoc");
	spotlightLoc = vec3(10 - 1.464161, 5, 3.5355339);

	//sets the cutoff angle of the spotlight
	u_cutoffAngle = gl.getUniformLocation(program, "u_cutoffAngle");

	//selection list for the cutoff angle
	const list = document.getElementById("Cutoff Angle");

	let stage = new Stage();
	stage.draw(30);

	let position = 3;       //determines which point at the wall the spotlight points at
	let spotLightWall = 0;  //which wall the spotlight is pointed at
	let observedWall = 0;   //which wall the camera points at

	//the selection list value changes
	list.addEventListener("change", (_) => {
		switch(list.value)
		{
		case "Small":
			stage.draw(7.5);
			break;

		case "Medium":
			stage.draw(15);
			break;

		case "Large":
			stage.draw(30);
			break;

		default:
			stage.draw(15);
		}
	});

	window.addEventListener('keydown', (e) => {
		//sets the position, observed wall, or spotlight wall based on key inputs
		switch(e.key)
		{
		case " ":
			observedWall = (observedWall + 1)%8;
			break;

		case "ArrowLeft":
			if(position%2 === 0)
			{
				position++;
				spotLightWall = (spotLightWall + 1)%8;
			}
			else
				position--;
			break;

		case "ArrowRight":
			if(position%2 === 1)
			{
				position--;
				spotLightWall = (spotLightWall + 7)%8;
			}
			else
				position++;
			break;

		case "ArrowDown":
			position = (position + 2)%6;
			break;

		case "ArrowUp":
			position = (position + 4)%6;
			break;

		default:
			break;
		}

		//it's easier to set a single value then rotate
		let eye = mult(rotateY(observedWall * 45), vec4(-40, 40, -16.5, 0));
		let at = mult(rotateY(observedWall * 45), vec4(10 - 1.464161, 5, 3.5355339, 0));
		spotlightLoc = mult(rotateY(spotLightWall * 45), vec4(10 - 1.464161*(position%2), 10 - 5*Math.trunc(position/2), 3.5355339*(position%2), 0));

		//convert values back into a vec3
		eye = vec3(eye[0], eye[1], eye[2]);
		at = vec3(at[0], at[1], at[2]);
		spotlightLoc = vec3(spotlightLoc[0], spotlightLoc[1], spotlightLoc[2]);

		viewMatrix = lookAt(eye, at, vec3(0, 1, 0));

		switch(list.value)
		{
		case "Small":
			stage.draw(7.5);
			break;

		case "Medium":
			stage.draw(15);
			break;

		case "Large":
			stage.draw(30);
			break;

		default:
			stage.draw(15);
		}
	});
};

//has all the stage information
class Stage
{
	static vertices = new Float32Array([
		10, 0, 0,                                       -1, 0, 0,
		7.0710678118654755, 0, -7.071067811865475,      -0.707107, 0 , 0.707107,
		0, 0, -10,                                      0, 0, 1,
		-7.071067811865475, 0, -7.0710678118654755,     0.707107, 0, 0.707107,
		-10, 0, 0,                                      1, 0, 0,
		-7.071067811865477, 0, 7.071067811865475,       0.707107, 0, -0.707107,
		0, 0, 10,                                       0, 0, -1,
		7.071067811865474, 0, 7.071067811865477,        -0.707107, 0, -0.707107,
		10.0, 10, 0,                                    -1, 0, 0,
		7.0710678118654755, 10, -7.071067811865475,     -0.707107, 0, 0.707107,
		0, 10, -10,                                     0, 0, 1,
		-7.071067811865475, 10, -7.0710678118654755,    0.707107, 0, 0.707107,
		-10, 10, 0,                                     1, 0, 0,
		-7.071067811865477, 10, 7.071067811865475,      0.707107, 0, -0.707107,
		0, 10, 10,                                      0, 0, -1,
		7.071067811865474, 10, 7.071067811865477,       -0.707107, 0, -0.707107,

		10, 0, 0,                                       0, 1, 0,
		7.0710678118654755, 0, -7.071067811865475,      0, 1, 0,
		0, 0, -10,                                      0, 1, 0,
		-7.071067811865475, 0, -7.0710678118654755,     0, 1, 0,
		-10, 0, 0,                                      0, 1, 0,
		-7.071067811865477, 0, 7.071067811865475,       0, 1, 0,
		0, 0, 10,                                       0, 1, 0,
		7.071067811865474, 0, 7.071067811865477,        0, 1, 0
	]);

	static indices = new Uint8Array([
		8, 9, 0,
		9, 1, 0,
		9, 10, 1,
		10, 2, 1,
		10, 11, 2,
		11, 3, 2,
		11, 12, 3,
		12, 4, 3,
		12, 13, 4,
		13, 5, 4,
		13, 14, 5,
		14, 6, 5,
		14, 15, 6,
		15, 7, 6,
		15, 8, 7,
		8, 0, 7,

		17, 18, 16,
		18, 19, 16,
		19, 20, 16,
		20, 21, 16,
		21, 22, 16,
		22, 23, 16
	]);

	static vertexBuffer;
	static indexBuffer;

	constructor()
	{
		if(!Stage.vertexBuffer && !Stage.indexBuffer)
		{
			Stage.vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Stage.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Stage.vertices, gl.STATIC_DRAW);

			Stage.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Stage.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Stage.indices, gl.STATIC_DRAW);
		}

	}

	draw(cutoffValue)
	{
		//preparing for drawing
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.bindBuffer(gl.ARRAY_BUFFER, Stage.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Stage.indexBuffer);

		//setting uniforms
		gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
		gl.uniformMatrix4fv(u_view, false, flatten(viewMatrix));
		gl.uniform3fv(u_spotlightLoc, flatten(spotlightLoc));
		gl.uniform1f(u_cutoffAngle, cutoffValue);

		//setting attributes
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
		gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

		//enabling attributes
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);

		//draw command
		gl.drawElements(gl.TRIANGLES, Stage.indices.length, gl.UNSIGNED_BYTE, 0);
	}
}