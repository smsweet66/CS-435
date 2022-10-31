/**
 * Sean Sweet CS 435 Project 2
 * car.js is a program that draws 6 different colored cars to the screen.
 * When any of the cars are clicked and dragged, a copy of the car is made and moved with the cursor.
 * When any of the copies are ctrl clicked, they are deleted.
 */

let gl;
let u_model;
let u_projection;

let projectionMatrix;

window.onload = function init()
{
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if(!gl)
        alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.7, 0.7, 1.0);

    const program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //uniform location for model matrix (used to translate the base car location)
    u_model = gl.getUniformLocation(program, "u_model");

    //changes the coordinates to pixel width and height
    u_projection = gl.getUniformLocation(program, "u_projection");
    projectionMatrix = ortho(0.0, canvas.width, 0.0, canvas.height, 1.0, -1.0);

    //array containing the original cars that cannot be moved or deleted
    let originals = [
        new Car(50, 800, [1, 0, 0]),
        new Car(200, 800, [0, 1, 0]),
        new Car(350, 800, [0, 0, 1]),
        new Car(500, 800, [1, 0, 1]),
        new Car(650, 800, [0, 1, 1]),
        new Car(800, 800, [1, 1, 0])
    ];


    let duplicates = [];        //array containing copies of the cars, initially empty
    let heldCarIndex = -1;      //the car that is currently being dragged by the cursor
    let mouseLocation = [0, 0]; //the current location of the mouse using screen coordinates
    let mouseOffset = [0, 0];   //the offset of the mouse from the bottom left of the car being moved

    drawAll();

    //tells what should happen when the mouse is pressed down
    gl.canvas.addEventListener('mousedown', (e) => {
        //transforms raw mouse location to screen coordinates
        const rect = canvas.getBoundingClientRect();
        mouseLocation[0] = e.clientX - rect.left;
        mouseLocation[1] = rect.bottom - e.clientY;

        let mouseClickHandled = false;  //prevents interacting with multiple cars simultaneously
        if(e.ctrlKey)   //checking for a ctrl click
        {
            for(let i=0; !mouseClickHandled && i<duplicates.length; i++)
            {
                if(duplicates[i].isInside(mouseLocation))
                {
                    duplicates.splice(i, 1);    //deletes selected car
                    mouseClickHandled = true;
                    drawAll();
                }
            }
        }
        else
        {
            //checking if copy was clicked
            for(let i = 0; !mouseClickHandled && i < duplicates.length; i++)
            {
                if(duplicates[i].isInside(mouseLocation))
                {
                    heldCarIndex = i;
                    mouseOffset[0] = mouseLocation[0] - duplicates[i].location[0];
                    mouseOffset[1] = mouseLocation[1] - duplicates[i].location[1];
                    mouseClickHandled = true;
                }
            }

            //checking if original was clicked
            for(let i=0; !mouseClickHandled && i<originals.length; i++)
            {
                if(originals[i].isInside(mouseLocation))
                {
                    duplicates.push(new Car(originals[i].location[0], originals[i].location[1], originals[i].color));
                    mouseOffset[0] = mouseLocation[0] - originals[i].location[0];
                    mouseOffset[1] = mouseLocation[1] - originals[i].location[1];
                    heldCarIndex = duplicates.length - 1;
                }
            }
        }
    });

    //tells what should happen when mouse is moved
    gl.canvas.addEventListener('mousemove', (e) => {
        if(heldCarIndex !== -1) //only does something if a car is currently selected
        {
            const rect = canvas.getBoundingClientRect();
            mouseLocation[0] = e.clientX - rect.left;
            mouseLocation[1] = rect.bottom - e.clientY;

            //moves the car then redraws
            duplicates[heldCarIndex].location[0] = mouseLocation[0] - mouseOffset[0];
            duplicates[heldCarIndex].location[1] = mouseLocation[1] - mouseOffset[1];
            drawAll();
        }
    })

    gl.canvas.addEventListener('mouseup', () => {
        heldCarIndex = -1;  //deselects car
    })

    //draws all existing cars
    function drawAll()
    {
        gl.clear(gl.COLOR_BUFFER_BIT);  //only called once when drawing everything
        for(let i=0; i<originals.length; i++)
            originals[i].draw();

        for(let i=0; i<duplicates.length; i++)
            duplicates[i].draw();
    }
};

//Car class containing vertex data for cars
class Car
{
    //the position of each vertex for the car
    static positions = [
        0, 0,
        100, 0,
        100, 20,
        50, 45,
        0, 20,
        12.5, 0,
        25.0, 0.0,
        22.612712429686844, 7.347315653655914,
        16.362712429686844, 11.888206453689419,
        8.637287570313159, 11.88820645368942,
        2.387287570313159, 7.347315653655915,
        0.0, 0.0,
        2.3872875703131573, -7.3473156536559125,
        8.637287570313156, -11.888206453689419,
        16.36271242968684, -11.88820645368942,
        22.61271242968684, -7.347315653655917,
        87.5, 0,
        100.0, 0.0,
        97.61271242968684, 7.347315653655914,
        91.36271242968684, 11.888206453689419,
        83.63728757031316, 11.88820645368942,
        77.38728757031316, 7.347315653655915,
        75.0, 0,
        77.38728757031316, -7.3473156536559125,
        83.63728757031316, -11.888206453689419,
        91.36271242968684, -11.88820645368942,
        97.61271242968684, -7.347315653655917,
    ];

    //the indices used to draw the cars
    static indices = new Uint8Array([
        0, 1, 2,
        2, 4, 0,
        2, 3, 4,
        5, 6, 7,
        5, 7, 8,
        5, 8, 9,
        5, 9, 10,
        5, 10, 11,
        5, 11, 12,
        5, 12, 13,
        5, 13, 14,
        5, 14, 15,
        5, 15, 6,
        16, 17, 18,
        16, 18, 19,
        16, 19, 20,
        16, 20, 21,
        16, 21, 22,
        16, 22, 23,
        16, 23, 24,
        16, 24, 25,
        16, 25, 26,
        16, 26, 17
    ]);

    vertices;       //data passed to vertex buffer
    vertexBuffer;   //vertex buffer id
    indexBuffer;    //index buffer id
    location;       //array containing x, y location
    color;          //color of car

    //creates a car based on its x, y offset and its color
    constructor(x, y, color)
    {
        this.color = color;
        this.vertices = [];

        //adds the car's position data and its color for the body of the car
        for(let i=0; i<5; i++)
        {
            this.vertices.push(Car.positions[2*i]);
            this.vertices.push(Car.positions[2*i + 1]);
            this.vertices.push(color[0]);
            this.vertices.push(color[1]);
            this.vertices.push(color[2]);
        }

        //adds the car's position data and the color black for the tires of the car
        for(let i=5; i<27; i++)
        {
            this.vertices.push(Car.positions[2*i]);
            this.vertices.push(Car.positions[2*i + 1]);
            this.vertices.push(0);
            this.vertices.push(0);
            this.vertices.push(0);
        }

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, Car.indices, gl.STATIC_DRAW);

        this.location = [x, y];
    }

    //checks whether mouse location is within the body of the car (tires not checked)
    isInside(mouseLocation)
    {
        for(let i=0; i<5; i++)
        {
            //uses cross product to determine whether the point is within the polygon
            //if point is to the left of each side going counter-clockwise, it is within the polygon, fails otherwise
            if(cross(vec3(Car.positions[(2*i + 2)%10] - Car.positions[(2*i)%10], Car.positions[(2*i + 3)%10] - Car.positions[(2*i + 1)%10], 0),
                vec3(mouseLocation[0] - Car.positions[(2*i + 2)%10] - this.location[0], mouseLocation[1] - Car.positions[(2*i + 3)%10] - this.location[1], 0))[2] < 0)
                return false;
        }

        return true;
    }

    //draws this car
    draw()
    {
        //binds vertex and index buffer and sets uniforms
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.uniformMatrix4fv(u_model, false, flatten(translate(this.location[0], this.location[1], 0.0)));
        gl.uniformMatrix4fv(u_projection, false, flatten(projectionMatrix));

        //enables vertex attributes 0 is location, 1, is color
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
        gl.enableVertexAttribArray(1);

        gl.drawElements(gl.TRIANGLES, Car.indices.length, gl.UNSIGNED_BYTE, 0);
    }
}