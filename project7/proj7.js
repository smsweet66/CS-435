/**
 * Sean Sweet CS 435 Project 7
 * proj7.js is a program that creates a simple game of Space Invaders.
 * When the player presses space, the cannon at the bottom of the screen fires at the aliens.
 * If the left or right arrow keys are pressed, then the cannon will move left or right.
 * Whether the player hits an alien is calculated using hit-scanning.  When all the aliens have been
 * destroyed, a message shows up saying that you have won.  If an alien reaches the bottom, a message
 * shows up saying that you have lost.  After both cases, the game restarts.
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

	let aliens = new AlienHorde();
	let player = new Player();

	window.addEventListener('keydown', (e) => {
		//player movement.
		switch(e.key)
		{
		case " ":
			aliens.hit(player.getMid());
			drawAll();
			//no more aliens
			if(aliens.aliens.location.length === 0)
			{
				window.alert("You Win!");
				aliens = new AlienHorde();
			}
			break;

		case "ArrowLeft":
			player.slide(-10);
			drawAll();
			break;

		case "ArrowRight":
			player.slide(10);
			drawAll();
			break;

		default:
			break;
		}
	});

	drawLoop();

	function drawLoop()
	{
		new Promise(resolve => setTimeout(resolve, 500)).then(() => {
			drawAll();

			//an alien reached the bottom
			if(!aliens.update())
			{
				window.alert("You Lose!");
				aliens = new AlienHorde();
			}

			drawLoop();
		});
	}

	function drawAll()
	{
		gl.clear(gl.COLOR_BUFFER_BIT);

		player.draw();
		aliens.draw();
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

//basic object used to store information for webgl
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

//information for each alien (most information is shared)
class Alien extends Object
{
	direction;

	constructor()
	{
		let vertices = new Float32Array([
			0, 0,   0, 0,
			50, 0,  1, 0,
			50, 50, 1, 1,
			0, 50,  0, 1
		]);

		super(vertices, "alien.png");
		this.direction = [];
	}

	/**
	 * adds location and direction to a list, creating an instance of the object
	 * @param location  the location of the new instance
	 * @param direction the direction the instance is moving
	 */
	addInstance(location, direction)
	{
		super.addInstance(location);
		this.direction.push(direction);
	}

	/**
	 * removes the ith object
	 * @param i the index being removed.
	 */
	removeInstance(i)
	{
		this.location.splice(i, 1);
		this.direction.splice(i, 1);
	}

	/**
	 * moves all aliens to their next positions
	 * @returns {boolean}   returns false if an alien reaches the bottom, true otherwise
	 */
	update()
	{
		for(let i=0; i<this.location.length; i++)
		{
			if((this.location[i][0] === 50 && this.direction[i] === false) || (this.location[i][0] === 500 && this.direction[i] === true))
			{
				this.location[i][1] -= 50;
				this.direction[i] = !this.direction[i];
			}
			else if(this.direction[i] === false)
				this.location[i][0] -= 25;
			else
				this.location[i][0] += 25;

			if(this.location[i][1] <= 50)
				return false;
		}

		return true;
	}

	/**
	 * Function that tells whether the alien is on the given x coordinate
	 * @param x the x coordinate
	 * @param i the index of the alien
	 */
	hit(x, i)
	{ return (x >= this.location[i][0]) && (x <= 50 + this.location[i][0]); }
}

//class containing all information for entire group of aliens
class AlienHorde
{
	aliens;

	constructor()
	{
		this.aliens = new Alien();

		let direction = false;
		let location = [50, 300, 0];
		for(let i=0; i<40; i++)
		{
			if((i+1)%10 !== 0)
			{
				let temp = [...location];
				this.aliens.addInstance(temp, direction);
			}

			if((i+1)%10 === 0)
			{
				location[1] += 50;
				direction = !direction;
			}
			else if(!direction)
				location[0] += 50;
			else
				location[0] -= 50;
		}

	}

	/**
	 * uses hit-scanning to test whether the shot fired by the player
	 * will hit an alien (can only hit one per shot)
	 * @param x the x location of the player
	 */
	hit(x)
	{
		for(let i=0; i<this.aliens.location.length; i++)
		{
			if(this.aliens.hit(x, i))
			{
				this.aliens.removeInstance(i);
				break;
			}
		}
	}

	/**
	 * updates all aliens
	 * @returns {boolean} false if an alien reached the bottom, true otherwise
	 */
	update()
	{ return this.aliens.update(); }

	/**
	 * draws all aliens
	 */
	draw()
	{ this.aliens.draw(); }
}

//class containing all information for the player's character
class Player
{
	object;

	// noinspection JSValidateTypes
	constructor()
	{
		let vertices = new Float32Array([
			0, 0,   0, 0,
			50, 0,  1, 0,
			50, 50, 1, 1,
			0, 50,  0, 1
		]);

		this.object = new Object(vertices, "player.webp");
		this.object.addInstance([275, 0, 0]);
	}

	/**
	 * gets the center of the player
	 * used for when the player fires a shot
	 * @returns {number}
	 */
	getMid()
	{ return this.object.location[0][0] + 25; }

	/**
	 * moves the player horizontally by the given amount
	 * @param x the amount the player moves
	 */
	slide(x)
	{ this.object.location[0][0] += x; }

	/**
	 * draws the player
	 */
	draw()
	{ this.object.draw(); }
}