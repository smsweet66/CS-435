/**
 * Sean Sweet CS 435 Project 3
 * modeling.js is a program that draws a gas station sign to the screen.
 * within the html, the price of each of the different fuel types can be increased and decreased,
 * which is then reflected in the sign.  Additionally, the sign can rotate.
 */

let gl;
let u_model;
let u_view;
let viewMatrix;
let u_projection;
let projectionMatrix;
let u_color;

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
	viewMatrix = lookAt(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));

	//changes the coordinates to pixel width and height
	u_projection = gl.getUniformLocation(program, "u_projection");
	projectionMatrix = ortho(canvas.width/2, -canvas.width/2, -canvas.height/2, canvas.height/2, 512, -512.0);

	u_color = gl.getUniformLocation(program, "u_color");

	let sign = new Sign();

	//gets the value of the drop-down list
	const list = document.getElementById("Fuel Type");

	//gets the up button from the html
	const up = document.getElementById("up");
	up.onclick = function()
	{
		//increases the fuel type selected in the drop-down list
		if(list.value === "Regular")
			sign.regularFuel.increase();
		else if(list.value === "Plus")
			sign.plusFuel.increase();
		else if(list.value === "Premium")
			sign.premiumFuel.increase();
	}

	//gets the down button from the html
	const down = document.getElementById("down");
	down.onclick = function()
	{
		//decreases the fuel type selected in the drop-down list
		if(list.value === "Regular")
			sign.regularFuel.decrease();
		else if(list.value === "Plus")
			sign.plusFuel.decrease();
		else if(list.value === "Premium")
			sign.premiumFuel.decrease();
	}

	let spinning = false;

	//gets the spin button from the html
	const spin = document.getElementById("spin");
	spin.onclick = function()
	{
		//swaps the text on the button between Start and Stop
		if(spin.innerHTML === "Start")
			spin.innerHTML = "Stop";
		else
			spin.innerHTML = "Start";
		
		spinning = !spinning;
	}

	drawSign(0);

	//drawing loop that takes the rotation of the sign as an argument
	function drawSign(theta)
	{
		//keeps theta between 0 and 360
		if(theta > 360)
			theta -= 360;
		else if(theta < 0)
			theta += 360;

		new Promise(resolve => setTimeout(resolve, 50)).then(() => {
			sign.draw(theta);

			//decides whether to increase the angle of rotation
			if(spinning)
				drawSign(theta + 1);
			else
				drawSign(theta);
		});
	}
};

//class that contains all the sign information including the text panels, the board and the post
class Sign
{
	regularFuel;
	plusFuel;
	premiumFuel;

	//board vertices
	static signData = new Float32Array([
		-275, 115, 2.5,
		-275, -105, 2.5,
		275, -105, 2.5,
		275, 115, 2.5,
		-275, 115, -2.5,
		-275, -105, -2.5,
		275, -105, -2.5,
		275, 105, -2.5
	]);
	static vertexBuffer;

	//post vertices
	static signPostData = new Float32Array([
		2.5, -105, 0.0,
		2.0225424859373686, -105, -1.469463130731183,
		0.7725424859373686, -105, -2.3776412907378837,
		-0.7725424859373684, -105, -2.377641290737884,
		-2.022542485937368, -105, -1.4694631307311832,
		-2.5, -105, 0,
		-2.022542485937369, -105, 1.4694631307311825,
		-0.7725424859373689, -105, 2.3776412907378837,
		0.7725424859373681, -105, 2.377641290737884,
		2.022542485937368, -105, 1.4694631307311834,

		2.5, -512, 0.0,
		2.0225424859373686, -512, -1.469463130731183,
		0.7725424859373686, -512, -2.3776412907378837,
		-0.7725424859373684, -512, -2.377641290737884,
		-2.022542485937368, -512, -1.4694631307311832,
		-2.5, -512, 0,
		-2.022542485937369, -512, 1.4694631307311825,
		-0.7725424859373689, -512, 2.3776412907378837,
		0.7725424859373681, -512, 2.377641290737884,
		2.022542485937368, -512, 1.4694631307311834
	]);
	static signPostVertexBuffer;

	//post indices
	static signPostIndices = new Uint8Array([
		1, 2, 0,
		2, 3, 0,
		3, 4, 0,
		4, 5, 0,
		5, 6, 0,
		6, 7, 0,
		7, 8, 0,
		8, 9, 0,

		19, 18, 10,
		18, 17, 10,
		17, 16, 10,
		16, 15, 10,
		15, 14, 10,
		14, 13, 10,
		13, 12, 10,
		12, 11, 10,

		10, 11, 1,
		11, 1, 0,
		11, 12, 2,
		12, 2, 1,
		12, 13, 3,
		13, 3, 2,
		13, 14, 4,
		14, 4, 3,
		14, 15, 5,
		15, 5, 4,
		15, 16, 6,
		16, 6, 5,
		16, 17, 7,
		17, 7, 6,
		17, 18, 8,
		18, 8, 7,
		18, 19, 9,
		19, 9, 8,
		19, 10, 0,
		10, 0, 9
	]);
	static signPostIndexBuffer;

	constructor()
	{
		//sets up the buffer information
		if(!Sign.vertexBuffer)
		{
			Sign.vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Sign.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Sign.signData, gl.STATIC_DRAW);

			Sign.signPostVertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, Sign.signPostVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, Sign.signPostData, gl.STATIC_DRAW);

			Sign.signPostIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sign.signPostIndexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Sign.signPostIndices, gl.STATIC_DRAW);
		}

		//creates the text panels
		this.regularFuel = new FuelType("Regular", 329, 70);
		this.plusFuel = new FuelType("Plus", 369, 0);
		this.premiumFuel = new FuelType("Premium", 409, -70);
	}

	//draws given a rotation value
	draw(theta)
	{
		gl.clear(gl.COLOR_BUFFER_BIT);

		//drawing the board
		gl.bindBuffer(gl.ARRAY_BUFFER, Sign.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Digit.indexBuffer);

		let modelMatrix = rotateY(theta);
		gl.uniformMatrix4fv(u_model, false, flatten(modelMatrix));
		gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
		gl.uniformMatrix4fv(u_view, false, flatten(viewMatrix));
		gl.uniform4fv(u_color, new Float32Array([.5, .5, .5, 1]));

		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);

		gl.drawElements(gl.TRIANGLES, Digit.segmentIndices.length, gl.UNSIGNED_BYTE, 0);

		//drawing the post
		gl.bindBuffer(gl.ARRAY_BUFFER, Sign.signPostVertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Sign.signPostIndexBuffer);

		gl.uniformMatrix4fv(u_model, false, flatten(modelMatrix));
		gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
		gl.uniformMatrix4fv(u_view, false, flatten(viewMatrix));
		gl.uniform4fv(u_color, new Float32Array([.5, .5, .5, 1]));

		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);

		gl.drawElements(gl.TRIANGLES, Sign.signPostIndices.length, gl.UNSIGNED_BYTE, 0);

		//draws the panel on both sides of the sign board
		this.regularFuel.draw(theta);
		this.regularFuel.draw(theta + 180);

		this.plusFuel.draw(theta);
		this.plusFuel.draw(theta + 180);

		this.premiumFuel.draw(theta);
		this.premiumFuel.draw(theta + 180);
	}
}

//class that contains all the information for each text panel
class FuelType
{
	type;
	typeDigits;
	price;
	priceDigits;
	height

	constructor(type, price, height)
	{
		this.height = height;
		this.type = type;
		this.typeDigits = [];
		for(let i=0; i<this.type.length; i++)
			this.typeDigits.push(new Digit(this.type[i], [-250 + 45*i, height]));

		this.price = price;
		let priceString = price.toString();
		this.priceDigits = [];
		for(let i=0; i<priceString.length; i++)
			this.priceDigits.push(new Digit(priceString[i], [150 + 45*i, height]));
	}

	//increases the price and recreates the number digits
	increase()
	{
		this.price++;
		let priceString = this.price.toString();
		this.priceDigits = [];
		for(let i=0; i<priceString.length; i++)
			this.priceDigits.push(new Digit(priceString[i], [150 + 45*i, this.height]));
	}

	//decreases the price and recreates the number digits
	decrease()
	{
		this.price--;
		let priceString = this.price.toString();
		this.priceDigits = [];
		for(let i=0; i<priceString.length; i++)
			this.priceDigits.push(new Digit(priceString[i], [150 + 45*i, this.height]));
	}

	//draws the text panel based on the angle of the sign
	draw(theta)
	{
		for(let i=0; i<this.typeDigits.length; i++)
			this.typeDigits[i].draw(theta);

		for(let i=0; i<this.priceDigits.length; i++)
			this.priceDigits[i].draw(theta);
	}
}

//class containing the information for each drawn character
class Digit
{
	//vertex information for each of the segments on a 16-segment display
	//split into 16 parts so each can be drawn seperately
	static segmentData = [
		new Float32Array([
			-10, 30, 5,
			-10, 25, 5,
			0, 25, 5,
			0, 30, 5,
			-10, 30, 0,
			-10, 25, 0,
			0, 25, 0,
			0, 30, 0
		]),
		new Float32Array([
			0, 30, 5,
			0, 25, 5,
			10, 25, 5,
			10, 30, 5,
			0, 30, 0,
			0, 25, 0,
			10, 25, 0,
			10, 30, 0
		]),
		new Float32Array([
			-15, 25, 5,
			-15, 0, 5,
			-10, 0, 5,
			-10, 25, 5,
			-15, 25, 0,
			-15, 0, 0,
			-10, 0, 0,
			-10, 25, 0,
		]),
		new Float32Array([
			-10, 22.5, 5,
			-5, 2.5, 5,
			-2.5, 5, 5,
			-7.5, 25, 5,
			-10, 22.5, 0,
			-5, 2.5, 0,
			-2.5, 5, 0,
			-7.5, 25, 0,
		]),
		new Float32Array([
			-2.5, 25, 5,
			-2.5, 0, 5,
			2.5, 0, 5,
			2.5, 25, 5,
			-2.5, 25, 0,
			-2.5, 0, 0,
			2.5, 0, 0,
			2.5, 25, 0,
		]),
		new Float32Array([
			2.5, 5, 5,
			5, 2.5, 5,
			10, 22.5, 5,
			7.5, 25, 5,
			2.5, 5, 0,
			5, 2.5, 0,
			10, 22.5, 0,
			7.5, 25, 0,
		]),
		new Float32Array([
			10, 25, 5,
			10, 0, 5,
			15, 0, 5,
			15, 25, 5,
			10, 25, 0,
			10, 0, 0,
			15, 0, 0,
			15, 25, 0,
		]),
		new Float32Array([
			-10, 2.5, 5,
			-10, -2.5, 5,
			0, -2.5, 5,
			0, 2.5, 5,
			-10, 2.5, 0,
			-10, -2.5, 0,
			0, -2.5, 0,
			0, 2.5, 0
		]),
		new Float32Array([
			0, 2.5, 5,
			0, -2.5, 5,
			10, -2.5, 5,
			10, 2.5, 5,
			0, 2.5, 0,
			0, -2.5, 0,
			10, -2.5, 0,
			10, 2.5, 0
		]),
		new Float32Array([
			-15, 0, 5,
			-15, -25, 5,
			-10, -25, 5,
			-10, 0, 5,
			-15, 0, 0,
			-15, -25, 0,
			-10, -25, 0,
			-10, 0, 0,
		]),
		new Float32Array([//y-27.5
			-10, -22.5, 5,
			-7.5, -25, 5,
			-2.5, -5, 5,
			-5, -2.5, 5,
			-10, -22.5, 0,
			-7.5, -25, 0,
			-2.5, -5, 0,
			-5, -2.5, 0,
		]),
		new Float32Array([
			-2.5, 0, 5,
			-2.5, -25, 5,
			2.5, -25, 5,
			2.5, 0, 5,
			-2.5, 0, 0,
			-2.5, -25, 0,
			2.5, -25, 0,
			2.5, 0, 0,
		]),
		new Float32Array([
			2.5, -5, 5,
			7.5, -25, 5,
			10, -22.5, 5,
			5, -2.5, 5,
			2.5, -5, 0,
			7.5, -25, 0,
			10, -22.5, 0,
			5, -2.5, 0,
		]),
		new Float32Array([
			10, 0, 5,
			10, -25, 5,
			15, -25, 5,
			15, 0, 5,
			10, 0, 0,
			10, -25, 0,
			15, -25, 0,
			15, 0, 0,
		]),
		new Float32Array([
			-10, -25, 5,
			-10, -30, 5,
			0, -30, 5,
			0, -25, 5,
			-10, -25, 0,
			-10, -30, 0,
			0, -30, 0,
			0, -25, 0
		]),
		new Float32Array([
			0, -25, 5,
			0, -30, 5,
			10, -30, 5,
			10, -25, 5,
			0, -25, 0,
			0, -30, 0,
			10, -30, 0,
			10, -25, 0
		])
	]

	static segmentIndices = new Uint8Array([
		1, 2, 0,
		2, 3, 0,
		7, 6, 4,
		6, 5, 4,
		4, 5, 0,
		5, 1, 0,
		5, 6, 1,
		6, 2, 1,
		6, 7, 2,
		7, 3, 2,
		7, 4, 3,
		4, 0, 3
	]);

	static vertexBuffers;
	static indexBuffer;

	character;
	location;
	activeSegments;

	constructor(character, location)
	{
		if(!Digit.vertexBuffers && !Digit.indexBuffer)
		{
			Digit.vertexBuffers = [];
			for(let i=0; i<Digit.segmentData.length; i++)
			{
				Digit.vertexBuffers.push(gl.createBuffer());
				gl.bindBuffer(gl.ARRAY_BUFFER, Digit.vertexBuffers[i]);
				gl.bufferData(gl.ARRAY_BUFFER, Digit.segmentData[i], gl.STATIC_DRAW);
			}

			Digit.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Digit.indexBuffer)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Digit.segmentIndices, gl.STATIC_DRAW);
		}

		this.character = character;
		this.location = location;

		//decides which segments should be active based on the character
		switch(character)
		{
		case '0':
			this.activeSegments = [0, 1, 2, 6, 9, 13, 14, 15];
			break;

		case '1':
			this.activeSegments = [4, 11];
			break;

		case '2':
			this.activeSegments = [0, 1, 6, 8, 10, 14, 15];
			break;

		case '3':
			this.activeSegments = [0, 1, 6, 7, 8, 13, 14, 15];
			break;

		case '4':
			this.activeSegments = [2, 6, 7, 8, 13];
			break;

		case '5':
			this.activeSegments = [0, 1, 2, 7, 8, 13, 14, 15];
			break;

		case '6':
			this.activeSegments = [2, 7, 8, 9, 13, 14, 15];
			break;

		case '7':
			this.activeSegments = [0, 1, 5, 10];
			break;

		case '8':
			this.activeSegments = [0, 1, 2, 6, 7, 8, 9, 13, 14, 15];
			break;

		case '9':
			this.activeSegments = [0, 1, 2, 6, 7, 8, 13];
			break;

		case 'a':
		case 'A':
			this.activeSegments = [0, 1, 2, 6, 7, 8, 9, 13];
			break;

		case 'b':
		case 'B':
			this.activeSegments = [0, 1, 4, 6, 8, 11, 13, 14, 15];
			break;

		case 'c':
		case 'C':
			this.activeSegments = [0, 1, 2, 9, 14, 15];
			break;

		case 'd':
		case 'D':
			this.activeSegments = [0, 1, 4, 6, 11, 13, 14, 15];
			break;

		case 'e':
		case 'E':
			this.activeSegments = [0, 1, 2, 7, 8, 9, 14, 15];
			break;

		case 'f':
		case 'F':
			this.activeSegments = [0, 1, 2, 7, 8, 9];
			break;

		case 'g':
		case 'G':
			this.activeSegments = [0, 1, 2, 8, 9, 13, 14, 15];
			break;

		case 'h':
		case 'H':
			this.activeSegments = [2, 6, 7, 8, 9, 13];
			break;

		case 'i':
		case 'I':
			this.activeSegments = [0, 1, 4, 11, 14, 15];
			break;

		case 'j':
		case 'J':
			this.activeSegments = [6, 9, 13, 14, 15];
			break;

		case 'k':
		case 'K':
			this.activeSegments = [2, 5, 7, 9, 12];
			break;

		case 'l':
		case 'L':
			this.activeSegments = [2, 9, 14, 15];
			break;

		case 'm':
		case 'M':
			this.activeSegments = [2, 3, 5, 6, 9, 13];
			break;

		case 'n':
		case 'N':
			this.activeSegments = [2, 3, 6, 9, 12, 13];
			break;

		case 'o':
		case 'O':
			this.activeSegments = [0, 1, 2, 6, 9, 13, 14, 15];
			break;

		case 'p':
		case 'P':
			this.activeSegments = [0, 1, 2, 6, 7, 8, 9];
			break;

		case 'q':
		case 'Q':
			this.activeSegments = [0, 1, 2, 6, 9, 12, 13, 14, 15];
			break;

		case 'r':
		case 'R':
			this.activeSegments = [0, 1, 2, 6, 7, 8, 9, 12];
			break;

		case 's':
		case 'S':
			this.activeSegments = [0, 1, 3, 12, 14, 15];
			break;

		case 't':
		case 'T':
			this.activeSegments = [0, 1, 4, 11];
			break;

		case 'u':
		case 'U':
			this.activeSegments = [2, 6, 9, 13, 14, 15];
			break;

		case 'v':
		case 'V':
			this.activeSegments = [2, 5, 9, 10];
			break;

		case 'w':
		case 'W':
			this.activeSegments = [2, 6, 9, 10, 12, 13];
			break;

		case 'x':
		case 'X':
			this.activeSegments = [3, 5, 10, 12];
			break;

		case 'y':
		case 'Y':
			this.activeSegments = [3, 5, 11];
			break;

		case 'z':
		case 'Z':
			this.activeSegments = [0, 1, 5, 10, 14, 15];
			break;

		default:
			this.activeSegments = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
			break;
		}
	}

	//draws the character given the angle of the sign
	draw(theta)
	{
		for(let i=0; i<this.activeSegments.length; i++)
		{
			//binds vertex and index buffer and sets uniforms
			gl.bindBuffer(gl.ARRAY_BUFFER, Digit.vertexBuffers[this.activeSegments[i]]);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Digit.indexBuffer);

			let modelMatrix = translate(this.location[0], this.location[1], 0);
			modelMatrix = mult(rotateY(theta), modelMatrix);
			gl.uniformMatrix4fv(u_model, false, flatten(modelMatrix));
			gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));
			gl.uniformMatrix4fv(u_view, false, flatten(viewMatrix));
			gl.uniform4fv(u_color, new Float32Array([0, 0, 0, 1]));

			gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(0);

			gl.drawElements(gl.TRIANGLES, Digit.segmentIndices.length, gl.UNSIGNED_BYTE, 0);
		}
	}
}