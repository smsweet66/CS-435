/**
 * Sean Sweet CS 435 Project 1
 * This program starts with a single equilateral triangle and generates the different iterations
 * of Koch's snowflake and draws each of them to the screen sequentially, looping when finished.
 */

const iterations = 12;
let positions = [
    -0.5, 0,
    0.0, Math.sqrt(3)/2,
    0.5, 0
];

let gl;
let aPosition;
let vertexBuffer;

window.onload = function init()
{
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if(!gl)
        alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    aPosition = gl.getAttribLocation(program, "aPosition");

    if(iterations < 1)
    {
        window.alert("iterations must be greater than 1");
        return;
    }

    //creates the vertex buffer and starts the drawing loop
    vertexBuffer = gl.createBuffer();
    draw(0);
};

/**
 * draws the snowflake with the given iteration
 * @param i the current iteration
 */
function draw(i)
{
    //binds the buffer data and sets up for printing to the screen
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    //clears what was previously drawn and draws to the screen
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINE_LOOP, 0, positions.length/2);

    //delays for half a second then generates the vertexes for the next iteration of the snowflake
    new Promise(resolve => setTimeout(resolve, 500)).then(() => {
        if (i < iterations-1)
        {
            //creates new array for storing the new points
            //has to be done this way as the new points occur in between existing points
            let newPositions = [positions[0], positions[1]];

            //creates a new triangle based on each existing pair of points
            for(let j=2; j<positions.length-1; j+=2)
            {
                newPositions.push((2*positions[j-2] + positions[j])/3);
                newPositions.push((2*positions[j-1] + positions[j+1])/3);

                //math for finding location of point of new triangle
                let x = (positions[j-2] + positions[j])/2;
                let y = (positions[j-1] + positions[j+1])/2;
                let xDiff = Math.sqrt(3)*(positions[j] - positions[j-2])/6;
                let yDiff = Math.sqrt(3)*(positions[j+1] - positions[j-1])/6;

                newPositions.push(x - yDiff);
                newPositions.push(y + xDiff);

                newPositions.push((positions[j-2] + 2*positions[j])/3);
                newPositions.push((positions[j-1] + 2*positions[j+1])/3);

                newPositions.push(positions[j]);
                newPositions.push(positions[j+1]);
            }

            //creates one last triangle based on the last and first points
            newPositions.push((2*positions[positions.length-2] + positions[0])/3);
            newPositions.push((2*positions[positions.length-1] + positions[1])/3);

            //math for finding location of point of new triangle
            let x = (positions[positions.length-2] + positions[0])/2;
            let y = (positions[positions.length-1] + positions[1])/2;
            let xDiff = Math.sqrt(3)*(positions[0] - positions[positions.length-2])/6;
            let yDiff = Math.sqrt(3)*(positions[1] - positions[positions.length-1])/6;

            newPositions.push(x - yDiff);
            newPositions.push(y + xDiff);

            newPositions.push((positions[positions.length-2] + 2*positions[0])/3);
            newPositions.push((positions[positions.length-1] + 2*positions[1])/3);

            //updates the vertices
            positions = newPositions;

            //draws the next iteration
            draw(i+1);
        }
        else    //finished drawing last iteration
        {
            //resets vertex data
            positions = [
                -0.5, 0,
                0.0, Math.sqrt(3)/2,
                0.5, 0
            ]

            //draws first iteration
            draw(0);
        }
    });
}