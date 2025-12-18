'use strict';

// Global variables
let gl;
let program;

// Shapes
let myCube = null;
let mySphere = null;
let myCylinder = null;
let myCone = null;

// Textures
let myTexture;

// Camera params
let camAngle = 45;
let camHeight = 5;

// Global Matrices
let projectionMatrix = glMatrix.mat4.create();
let viewMatrix = glMatrix.mat4.create();
let modelMatrix = glMatrix.mat4.create();

//
// Create shapes and VAOs
//
function createShapes() {
    // 1. Cube
    myCube = new Cube(20);
    myCube.VAO = bindVAO(myCube, program);

    // 2. Sphere
    mySphere = new Sphere(20, 20);
    mySphere.VAO = bindVAO(mySphere, program);

    // 3. Cylinder
    myCylinder = new Cylinder(20, 20);
    myCylinder.VAO = bindVAO(myCylinder, program);

    // 4. Cone
    myCone = new Cone(20, 20);
    myCone.VAO = bindVAO(myCone, program);
}

//
// Set up Camera
//
function setUpCamera(program) {
    gl.useProgram(program);

    // Projection
    glMatrix.mat4.perspective(projectionMatrix, glMatrix.glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    let projLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    gl.uniformMatrix4fv(projLoc, false, projectionMatrix);

    // View (Orbit camera)
    let radius = 15;
    let camX = radius * Math.sin(glMatrix.glMatrix.toRadian(camAngle));
    let camZ = radius * Math.cos(glMatrix.glMatrix.toRadian(camAngle));
    
    glMatrix.mat4.lookAt(viewMatrix, [camX, camHeight, camZ], [0, 2, 0], [0, 1, 0]);
    let viewLoc = gl.getUniformLocation(program, "uViewMatrix");
    gl.uniformMatrix4fv(viewLoc, false, viewMatrix);

    // Send Camera Position for Specular Lighting
    let viewPosLoc = gl.getUniformLocation(program, "uViewPosition");
    gl.uniform3f(viewPosLoc, camX, camHeight, camZ);
}

//
// Set up Textures
//
function setUpTextures() {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    
    myTexture = gl.createTexture();
    let image = document.getElementById('my-texture');
    
    // Check if image loaded, otherwise use a fallback color
    if (image && image.complete && image.naturalWidth !== 0) {
        gl.bindTexture(gl.TEXTURE_2D, myTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);
    } else {
        console.warn("Texture image not found or not loaded yet. Using single color.");
        // Bind a single white pixel if texture missing to prevent crash
        gl.bindTexture(gl.TEXTURE_2D, myTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    }
}

//
// Set Lighting Uniforms
//
function setUpLights() {
    let lightPosLoc = gl.getUniformLocation(program, "uLightPosition");
    gl.uniform3f(lightPosLoc, 5.0, 10.0, 5.0); // Light up and to the right
}

//
// Helper to draw a specific object with transforms and material
//
function drawObject(shape, matrix, color, texture = null) {
    let modelLoc = gl.getUniformLocation(program, "uModelMatrix");
    gl.uniformMatrix4fv(modelLoc, false, matrix);

    let colorLoc = gl.getUniformLocation(program, "uColor");
    gl.uniform3fv(colorLoc, color);

    let kaLoc = gl.getUniformLocation(program, "uKa");
    let kdLoc = gl.getUniformLocation(program, "uKd");
    let ksLoc = gl.getUniformLocation(program, "uKs");
    let shineLoc = gl.getUniformLocation(program, "uShininess");
    let useTexLoc = gl.getUniformLocation(program, "uUseTexture");

    // Default Material (Shiny Plastic-like)
    gl.uniform1f(kaLoc, 0.3);
    gl.uniform1f(kdLoc, 0.7);
    gl.uniform1f(ksLoc, 0.8);
    gl.uniform1f(shineLoc, 32.0);

    if (texture) {
        gl.uniform1i(useTexLoc, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    } else {
        gl.uniform1i(useTexLoc, 0);
    }

    if (shape && shape.VAO) {
        gl.bindVertexArray(shape.VAO);
        gl.drawElements(gl.TRIANGLES, shape.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

//
// Main Draw Function
//
function drawShapes() {
    
    // --- 1. Draw the Luxo Ball (Textured Sphere) ---
    let ballMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(ballMatrix, ballMatrix, [2, 1, 2]); // x=2, y=1 (radius 1), z=2
    glMatrix.mat4.scale(ballMatrix, ballMatrix, [1.0, 1.0, 1.0]); 
    drawObject(mySphere, ballMatrix, [1.0, 1.0, 1.0], myTexture); 

    // --- 2. Draw the Floor (Flattened Cube) ---
    let floorMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(floorMatrix, floorMatrix, [0, -0.5, 0]);
    glMatrix.mat4.scale(floorMatrix, floorMatrix, [20, 1, 20]);
    // Material: Dark grey, Matte
    let ksLoc = gl.getUniformLocation(program, "uKs");
    gl.uniform1f(ksLoc, 0.1); 
    drawObject(myCube, floorMatrix, [0.4, 0.4, 0.4], null);

    // --- 3. Draw Luxo Jr. Lamp ---
    let lampColor = [0.7, 0.7, 0.7];

    // A. Base (Flattened Cylinder)
    let baseMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(baseMatrix, baseMatrix, [-2, 0.1, -1]); 
    glMatrix.mat4.scale(baseMatrix, baseMatrix, [1.5, 0.2, 1.5]);
    drawObject(myCylinder, baseMatrix, lampColor);

    // Save position for the arm
    let currentMatrix = glMatrix.mat4.create();
    glMatrix.mat4.translate(currentMatrix, currentMatrix, [-2, 0.2, -1]); 

    // B. Lower Arm
    let arm1Matrix = glMatrix.mat4.clone(currentMatrix);
    glMatrix.mat4.rotateZ(arm1Matrix, arm1Matrix, glMatrix.glMatrix.toRadian(-30));
    glMatrix.mat4.translate(arm1Matrix, arm1Matrix, [0, 1.5, 0]); 
    let drawArm1 = glMatrix.mat4.clone(arm1Matrix);
    glMatrix.mat4.scale(drawArm1, drawArm1, [0.2, 3.0, 0.2]); 
    drawObject(myCube, drawArm1, lampColor);

    // C. Joint
    glMatrix.mat4.translate(arm1Matrix, arm1Matrix, [0, 1.5, 0]); 
    let jointMatrix = glMatrix.mat4.clone(arm1Matrix);
    glMatrix.mat4.scale(jointMatrix, jointMatrix, [0.4, 0.4, 0.4]);
    drawObject(mySphere, jointMatrix, [0.3, 0.3, 0.3]); 

    // D. Upper Arm
    let arm2Matrix = glMatrix.mat4.clone(arm1Matrix);
    glMatrix.mat4.rotateZ(arm2Matrix, arm2Matrix, glMatrix.glMatrix.toRadian(70)); 
    glMatrix.mat4.translate(arm2Matrix, arm2Matrix, [0, 1.5, 0]);
    let drawArm2 = glMatrix.mat4.clone(arm2Matrix);
    glMatrix.mat4.scale(drawArm2, drawArm2, [0.2, 3.0, 0.2]);
    drawObject(myCube, drawArm2, lampColor);

    // E. Lamp Head
    glMatrix.mat4.translate(arm2Matrix, arm2Matrix, [0, 1.5, 0]); 
    let headMatrix = glMatrix.mat4.clone(arm2Matrix);
    glMatrix.mat4.rotateZ(headMatrix, headMatrix, glMatrix.glMatrix.toRadian(80)); 
    glMatrix.mat4.rotateY(headMatrix, headMatrix, glMatrix.glMatrix.toRadian(-20));
    glMatrix.mat4.scale(headMatrix, headMatrix, [1.5, 1.5, 1.5]); 
    drawObject(myCone, headMatrix, lampColor);

    // F. Light Bulb
    let bulbMatrix = glMatrix.mat4.clone(headMatrix);
    glMatrix.mat4.translate(bulbMatrix, bulbMatrix, [0, 0.5, 0]); 
    glMatrix.mat4.scale(bulbMatrix, bulbMatrix, [0.4, 0.4, 0.4]);
    gl.uniform1f(ksLoc, 1.0);
    drawObject(mySphere, bulbMatrix, [1.0, 1.0, 0.9]);
}

//
// Create Program
//
function initPrograms() {
    program = initProgram('phong-V', 'phong-F');
}

//
// Create VAO
//
function bindVAO(shape, program) {
    // Defines 'theVAO' to ensure no reference errors
    let theVAO = gl.createVertexArray();
    gl.bindVertexArray(theVAO);

    // Position
    let posLoc = gl.getAttribLocation(program, "aVertexPosition");
    if (posLoc !== -1) {
        let vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.points), gl.STATIC_DRAW);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(posLoc);
    }

    // Normals
    let normLoc = gl.getAttribLocation(program, "aNormal");
    if (normLoc !== -1 && shape.normals.length > 0) {
        let nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normLoc);
    }

    // UVs
    let uvLoc = gl.getAttribLocation(program, "aUV");
    if (uvLoc !== -1 && shape.uv.length > 0) {
        let uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape.uv), gl.STATIC_DRAW);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uvLoc);
    }

    // Indices
    let iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    return theVAO;
}

//
// Utility: Init Program
//
function initProgram(vID, fID) {
    let vShader = getShader(vID);
    let fShader = getShader(fID);
    let prog = gl.createProgram();
    gl.attachShader(prog, vShader);
    gl.attachShader(prog, fShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Could not init program");
        return null;
    }
    return prog;
}

function getShader(id) {
    let script = document.getElementById(id);
    if (!script) {
        console.error("Shader script not found: " + id);
        return null;
    }
    let src = script.text.trim();
    let shader = null;
    if(script.type === "x-shader/x-vertex") shader = gl.createShader(gl.VERTEX_SHADER);
    else if(script.type === "x-shader/x-fragment") shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    setUpCamera(program);
    setUpLights();
    drawShapes();
}

function init() {
    let canvas = document.getElementById('webgl-canvas');
    gl = canvas.getContext('webgl2');
    if(!gl) return;

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    initPrograms();
    createShapes();
    setUpTextures(); // This handles the error gracefully now
    
    window.addEventListener('keydown', gotKey, false);
    
    draw();
}