var VSHADER_SOURCE =
    `attribute vec4 a_Position;
     attribute float a_Size;
     attribute vec4 a_Color;
     attribute mat4 u_ModelMatrix;
     attribute vec3 a_Normalv;
     uniform mat4 u_GlobalModelMatrix;

     varying lowp vec4 vColor;
     varying vec3 vNormal;

     void main() {
       gl_Position = u_GlobalModelMatrix * u_ModelMatrix * a_Position;
       gl_PointSize = a_Size;
       vColor = a_Color;
       vNormal = a_Normalv;
     }`;

var FSHADER_SOURCE =
   `precision mediump float;
    uniform vec4 u_FragColor;
    uniform vec3 u_reverseLightDirection;
    varying vec3 vNormal; 
    varying lowp vec4 vColor;                                    
    void main() {
      vec3 normal = normalize(vNormal);
      gl_FragColor = vColor;
      float light = dot(normal, u_reverseLightDirection);
      gl_FragColor.rgb *= light;
    }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let a_Size;
let u_ModelMatrix;
let u_GlobalModelMatrix;
let a_Color;
let a_Normalv;
let u_reverseLightDirection;

let matrices = [];
let matrixBuffer;

var g_globalAngle = 0;
var g_globalAngleX = 0;
var g_globalZoom = 1;

// Joints
var joint1 = 0;
var joint2 = 0;

var tjoint1 = 0;
var tjoint2 = 0;
var tjoint3 = 0;
var tjoint4 = 0;

var tjointup = -10;

var wingAngle = 0;
var tailWag = 0;

// MouseControl for rotate
var isMouseDown = false;
var initialX = 0;
var changeX = 0;


// ext
let ext;

function clearCanvas(){
    g_LayerList = [[]];
    var layerContainer = document.getElementById("layers");
    layerContainer.innerHTML = layersInner;
    g_selectedLayer = 0;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function initConeBuffers() {
    coneVertexBuffer = gl.createBuffer();
    if (!coneVertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    generateConeVerticies();
    gl.bindBuffer(gl.ARRAY_BUFFER, coneVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneVerticies), gl.STATIC_DRAW);
    coneIndexBuffer = gl.createBuffer();
    if (!coneIndexBuffer){
        console.log('Failed to create the buffer object');
        return -1;
    }
    generateConeIndicies();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coneIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coneIndicies), gl.STATIC_DRAW);
    coneNormalsBuffer = gl.createBuffer();
    if (!coneNormalsBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    generateConeNormals();
    gl.bindBuffer(gl.ARRAY_BUFFER, coneNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneNormals), gl.STATIC_DRAW);

    coneMatrixBuffer = gl.createBuffer();
    if (!coneNormalsBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    coneColorBuffer = gl.createBuffer();
    if (!coneColorBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
}

function initCubeBuffers() {
    matrixBuffer = gl.createBuffer();
    if (!matrixBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicies, gl.STATIC_DRAW);
    
    vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticies, gl.STATIC_DRAW);
    colorBuffer = gl.createBuffer();
    if (!colorBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    cubeNormalsBuffer = gl.createBuffer();
    if (!cubeNormalsBuffer) {
        console.log('Failed to create buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeNormals, gl.STATIC_DRAW);
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    ext = gl.getExtension('ANGLE_instanced_arrays');
}

function HTMLActions() {
    document.getElementById("angle").addEventListener("mousemove", function() {g_globalAngle = this.value; renderAllShapes();});
    document.getElementById("zoom").addEventListener("mousemove", function() {g_globalZoom = this.value; renderAllShapes();});
    document.getElementById("flap").addEventListener("mousemove", function() {if (!flying) {joint1 = this.value; joint2 = this.value;} renderAllShapes();});
    document.getElementById("tail").addEventListener("mousemove", function() {
        if (!wagging) {
            tjoint1 = this.value;
            tjoint2 = (tjoint1)*1.1;
            tjoint3 = (tjoint2)*1.2;
            tjoint4 = (tjoint3)*0.5; renderAllShapes();}});

    document.getElementById("joint1").addEventListener("mousemove", function() {if (!flying) {joint1 = this.value; renderAllShapes();}});
    document.getElementById("joint2").addEventListener("mousemove", function() {if (!flying) {joint2 = this.value; renderAllShapes();}});

    document.getElementById("tjoint1").addEventListener("mousemove", function() {if (!wagging) {tjoint1 = this.value; renderAllShapes();}});
    document.getElementById("tjoint2").addEventListener("mousemove", function() {if (!wagging) {tjoint2 = this.value; renderAllShapes();}});
    document.getElementById("tjoint3").addEventListener("mousemove", function() {if (!wagging) {tjoint3 = this.value; renderAllShapes();}});
    document.getElementById("tjoint4").addEventListener("mousemove", function() {if (!wagging) {tjoint4 = this.value; renderAllShapes();}});

    document.getElementById("webgl").addEventListener("mousedown", (ev) => mDown(ev));
    document.getElementById("webgl").addEventListener("mousemove", (ev) => mMove(ev));
    document.getElementById("webgl").addEventListener("mouseup", (ev) => mUp(ev));
    document.getElementById("webgl").addEventListener("click", (ev) => shiftClickedHandler(ev));
}

function mDown(ev) {
    isMouseDown = true;
    initialX = ev.clientX;
    
}

function mMove(ev) {
    if (isMouseDown){
        changeX = ev.clientX - initialX;
        changeX = changeX * 0.03;
        g_globalAngle -= changeX;
        renderAllShapes();
    }
}

function mUp() {
    if (isMouseDown) {
        isMouseDown = !isMouseDown;
    }
}

function connectVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize Shaders');
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log("Failed to get the location of a_Position");
        return;
    }

    a_Normalv = gl.getAttribLocation(gl.program, 'a_Normalv');
    if (a_Position < 0) {
        console.log("Failed to get the location of a_Position");
        return;
    }

    a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log("Failed to get the location of a_Size");
        return;
    }

    u_ModelMatrix = gl.getAttribLocation(gl.program, 'u_ModelMatrix');
    if (u_ModelMatrix < 0) {
        console.log("Failed to get the location u_ModelMatrix");
        return;
    }

    u_GlobalModelMatrix = gl.getUniformLocation(gl.program, 'u_GlobalModelMatrix');
    if (!u_GlobalModelMatrix) {
        console.log("Failed to get the location u_GlobalModelMatrix");
        return;
    }

    u_reverseLightDirection = gl.getUniformLocation(gl.program, 'u_reverseLightDirection');
    if (!u_reverseLightDirection) {
        console.log("Failed to get the location u_GlobalModelMatrix");
        return;
    }
}

function main() {

    setupWebGL();

    initCubeBuffers();
    initConeBuffers();

    HTMLActions();

    connectVariablesToGLSL();

    gl.clearColor(0.53, 0.81, 0.92, 1.0);
    initializeCubes();
    requestAnimationFrame(tick);
}   


function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return [x,y]
}

function flyToggle() {
    flying = !flying;
    wagging = !wagging;
}

let animationStartTime = null;
let currentAnimationStage = 0;

var temp = 0;


let animationStages = [
    {
        duration: 1.5,
        update: (progress) => {
            var factor = 5/1.5;
            joint1 = 20*Math.sin(5*g_seconds);
            joint2 = 20*Math.sin(5*g_seconds);
            legJoint1 -= progress*1;
            legJoint2 -= progress*1;
            legJoint3 -= progress*1;
            legJoint4 -= progress*1;
            toothlessHeight += progress*0.01;
            platformHeight -= progress*0.05;
            tjoint1 = 5*Math.sin(g_seconds);
            tjoint2 = (tjoint1)*1.1;
            joint3 = (tjoint2)*1.2;
            tjoint4 = (tjoint3)*0.5;
            tjointup += progress*factor*0.05
            temp = toothlessHeight;
        }
    },
    {
        duration: 9.44,
        update: (progress) => {
            joint1 = 10*Math.sin(g_seconds-1.5);
            joint2 = 10*Math.sin(g_seconds-1.5);
            headrotate = 5*Math.sin(g_seconds);
            toothlessHeight = temp + 0.5*Math.sin(g_seconds-1.5);
            tjoint1 = 5*Math.sin(g_seconds);
            tjoint2 = (tjoint1)*1.1;
            joint3 = (tjoint2)*1.2;
            tjoint4 = (tjoint3)*0.5;
        }
    },
    {
        duration: 2,
        update: (progress) => {
            var factor = (-toothlessHeight)/2;
            var factor1 = (-platformHeight)/2;
            var factor2 = -1.7;
            legJoint1 += progress*0.8;
            legJoint2 += progress*0.8;
            legJoint3 += progress*0.8;
            legJoint4 += progress*0.8;
            toothlessHeight += progress*factor*0.08;
            joint1 = 20*Math.sin(5*g_seconds);
            joint2 = 20*Math.sin(5*g_seconds);
            platformHeight += progress*factor1*0.08;
            tjointup += progress*factor2*0.08;
        }
    }
]

function updateAnimation() {
    if (flying && !shiftClicked) {
        joint1 = 10*Math.sin(2*g_seconds);
        joint2 = 10*Math.sin(2*g_seconds);
    }
    if (wagging && !shiftClicked) {
        tjoint1 = 10*Math.sin(g_seconds);
        tjoint2 = (tjoint1)*1.1;
        tjoint3 = (tjoint2)*1.2;
        tjoint4 = (tjoint3)*0.5;
        headrotate = 10*Math.sin(g_seconds);
    }
    if (shiftClicked) {
        if (animationStartTime == null){
            animationStartTime = g_seconds;
            flying = false;
            wagging = false;
        }

        const deltaTime = g_seconds - animationStartTime;
        if (deltaTime < animationStages[currentAnimationStage].duration) {  
            const stageProgress = deltaTime / animationStages[currentAnimationStage].duration;
            animationStages[currentAnimationStage].update(stageProgress);
        } else {
            animationStartTime = g_seconds;
            currentAnimationStage++;
            if (currentAnimationStage >= animationStages.length){
                shiftClicked = false;
                flying = true;
                wagging = true;
                animationStartTime = null;
                currentAnimationStage = 0;
            }
        }
    }
}

var shiftClicked = false;

function shiftClickedHandler(ev) {
    if (ev.shiftKey) {
        if (!shiftClicked) {
            shiftClicked = true;
        }
    }
}

var legJoint1 = 0;
var legJoint2 = 0;
var legJoint3 = 0;
var legJoint4 = 0;

var headrotate = 0;

var platformHeight = 0;
var toothlessHeight = 0;


var flying = true;
var wagging = true;

var startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - startTime;

function tick() {
    renderAllShapes();
    g_seconds = performance.now()/1000.0 - startTime;
    updateAnimation();

    requestAnimationFrame(tick);
}

function drawAllCubes() {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);


    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(matrices), gl.DYNAMIC_DRAW);

    const bytesPerMatrix = 4*16;
    for (let i=0; i < 4; ++i) {
        const loc = u_ModelMatrix + i;
        gl.enableVertexAttribArray(loc);
        const offset = i*16;
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, offset);
        ext.vertexAttribDivisorANGLE(loc, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
    gl.enableVertexAttribArray(a_Normalv);
    gl.vertexAttribPointer(a_Normalv, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeColors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(a_Color);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(a_Color, 1);

    var lightDirection = new Vector3([-2, 4, -1.5]);
    gl.uniform3fv(u_reverseLightDirection, new Float32Array(lightDirection.normalize().elements));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    ext.drawElementsInstancedANGLE(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, 56);
}

function drawAllCones() {
    gl.bindBuffer(gl.ARRAY_BUFFER, coneVertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);


    gl.bindBuffer(gl.ARRAY_BUFFER, coneMatrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneMatrices), gl.DYNAMIC_DRAW);

    const bytesPerMatrix = 4*16;
    for (let i=0; i < 4; ++i) {
        const loc = u_ModelMatrix + i;
        gl.enableVertexAttribArray(loc);
        const offset = i*16;
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, offset);
        ext.vertexAttribDivisorANGLE(loc, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, coneNormalsBuffer);
    gl.enableVertexAttribArray(a_Normalv);
    gl.vertexAttribPointer(a_Normalv, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, coneColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coneColors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(a_Color);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    ext.vertexAttribDivisorANGLE(a_Color, 1);

    var lightDirection = new Vector3([-2, 4, -1.5]);
    gl.uniform3fv(u_reverseLightDirection, new Float32Array(lightDirection.normalize().elements));

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coneIndexBuffer);
    ext.drawElementsInstancedANGLE(gl.TRIANGLES, 60, gl.UNSIGNED_SHORT, 0, 4);
}

function renderAllShapes() {
    var startTime = performance.now();
    var globalMatrix = new Matrix4();
    globalMatrix.rotate(g_globalAngle, 0, 1, 0);
    globalMatrix.rotate(-5, 1, 0, 0);
    globalMatrix.scale(1/g_globalZoom, 1/g_globalZoom, 1/g_globalZoom);
    gl.uniformMatrix4fv(u_GlobalModelMatrix, false, globalMatrix.elements);

    coneMatrices = [];
    coneColors = [];
    cubeColors = [];
    matrices = [];
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var M = new Matrix4();
    M.scale(0.6, 0.6, 0.6);
    platform.matrix.set(M);
    platform.matrix.scale(1.4, 0.5, 1.4);
    platform.matrix.translate(0, -3 + platformHeight, 0);
    M.translate(0, toothlessHeight-0.5, -0.3);
    drawToothless(M);
    cubeColors = cubeColors.concat(groundColor);
    platform.render();
    drawAllCubes();
    drawAllCones();
    var duration = performance.now() - startTime;
    document.getElementById("performance").textContent = "ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration);
}

var toothlessSchema = {
    body: [],
    leg0: [],
    leg1: [],
    leg2: [],
    leg3: [],
    wing0: [],
    wing1: [],
    tail: [],
    head: [],
    eye0: [],
    eye1: [],
}

var toothelessCones = [];

var platform;

function initializeCubes() {
    platform = new Cube();
    for (let i = 0; i < 3; i++) {
        toothlessSchema.body.push(new Cube());
    }
    for (let i = 0; i < 4; i++) {
        toothlessSchema.leg0.push(new Cube());
        toothlessSchema.leg1.push(new Cube());
        toothlessSchema.leg2.push(new Cube());
        toothlessSchema.leg3.push(new Cube());
        toothlessSchema.wing0.push(new Cube());
        toothlessSchema.wing1.push(new Cube());
    }
    for (let i = 0; i < 7; i++) {
        toothlessSchema.tail.push(new Cube());
        toothlessSchema.head.push(new Cube());
    }
    for (let i = 0; i < 2; i++) {
        toothlessSchema.eye0.push(new Cube());
        toothlessSchema.eye1.push(new Cube());
    }

    for (let i = 0; i < 4; i++) {
        toothelessCones.push(new Cone());
    }
}

function drawToothless(M) {
    var M1 = new Matrix4(M);
    M1.scale(0.7, 0.7, 0.7);
    body(M1, toothlessSchema.body);
    M1.set(M);
    M1.scale(0.5, 0.5, 0.5);
    M1.translate(0.5, -0.4, -1);
    leg(M1, toothlessSchema.leg0, legJoint1);
    M1.translate(-1, 0, 0);
    leg(M1, toothlessSchema.leg1, legJoint2);
    M1.translate(0, 0, 1.8);
    leg(M1, toothlessSchema.leg2, legJoint3);
    M1.translate(1, 0, 0);
    leg(M1, toothlessSchema.leg3, legJoint4);
    M1.set(M);
    M1.rotate(-5, 1, 0, 0);
    M1.scale(0.7, 0.7, 0.7);
    M1.translate(0, 0.4, -0.6);
    head(M1, toothlessSchema);
    M1.set(M);
    M1.rotate(-10, 1, 0, 0);
    M1.rotate(tjoint1, 0, 1, 0);
    M1.scale(0.4, 0.4, 0.4);
    M1.translate(0, 0, 2);
    tail(M1, toothlessSchema.tail)
    M1.set(M);
    M1.rotate(-joint1, 0, 0, 1);
    M1.rotate(20, -1, 0, 0);
    M1.rotate(-90, 0, 1, 0);
    M1.rotate(45, 0, 0, 1);
    M1.scale(0.5, 0.5, 0.5);
    M1.translate(0, 1, -0.6);
    wings(M1, joint2, toothlessSchema.wing0);
    M1.set(M);
    M1.rotate(joint1, 0, 0, 1);
    M1.rotate(-20, 1, 0, 0);
    M1.rotate(90, 0, 1, 0);
    M1.rotate(-45, 0, 0, 1);
    M1.scale(0.5, 0.5, 0.5);
    M1.translate(0, 1, -0.6);
    wings(M1, -joint2, toothlessSchema.wing1);
}

// Colors
let darkGrey = [0.3, 0.3, 0.3, 1.0];
let black = [0.1, 0.1, 0.1, 1.0];
let darkWhite = [1.0, 1.0, 1.0, 1.0];
let eyeColor = [0.1, 1.0, 0.05, 1.0];
let red = [1.0, 0, 0, 1.0];
let groundColor = [0.48, 0.99, 0, 1.0];

function body(M, l) {
    l[0].color = darkGrey;
    l[0].matrix.set(M);
    l[0].matrix.rotate(10, 1, 0, 0);
    l[0].matrix.scale(0.5, 0.2, 0.8);
    l[0].render();
    l[1].matrix = new Matrix4(l[0].matrix);
    l[1].color = darkGrey;
    l[1].matrix.scale(0.6, 0.6, 0.6);
    l[1].matrix.translate(0, -2, 0);
    l[1].render();
    l[2].matrix = new Matrix4(l[0].matrix);
    l[2].color = darkGrey;
    l[2].matrix.scale(0.6, 0.7, 0.8);
    l[2].matrix.translate(0, 1.5, 0);
    l[2].render();
}

function leg(M, l, a) {
    l[0].color = darkGrey;
    l[0].matrix.set(M);
    l[0].matrix.rotate(0, 1, 0, 0);
    l[0].matrix.scale(0.2, 0.2, 0.1);
    l[0].matrix.translate(0, 1, 0);
    l[0].render();
    l[1].color = darkGrey;
    l[1].matrix.set(M);
    l[1].matrix.rotate(a, 1, 0, 0);
    l[1].matrix.scale(0.2, 0.2, 0.1);
    l[1].matrix.translate(0, -1, 0);
    l[1].render();
    l[2].color = darkGrey;
    l[2].matrix = new Matrix4(l[1].matrix);
    l[2].matrix.scale(1, 0.5, 2);
    l[2].matrix.translate(0, -3, -0.5);
    l[2].render();
    l[3].color = darkWhite;
    l[3].matrix = new Matrix4(l[2].matrix);
    l[3].matrix.scale(0.2, 0.5, 0.3);
    l[3].matrix.translate(0, -1, -4);
    l[3].render();
    l[3].matrix.translate(3, 0, 0);
    l[3].render();
    l[3].matrix.translate(-6, 0, 0);
    l[3].render();
}

function head(M, l) {
    l.head[0].color = darkGrey;
    l.head[0].matrix.set(M);
    l.head[0].matrix.rotate(-10, 1, 0, 0);
    l.head[0].matrix.rotate(-headrotate, 0, 1, 0);
    l.head[0].matrix.scale(0.2, 0.2, 0.1);
    l.head[0].render();
    l.head[1].color = darkGrey;
    l.head[1].matrix = new Matrix4(l.head[0].matrix);
    l.head[1].matrix.scale(2, 0.25, 2);
    l.head[1].matrix.translate(0, 2, -1);
    l.head[1].render();
    l.head[2].color = darkGrey;
    l.head[2].matrix = new Matrix4(l.head[1].matrix);
    l.head[2].matrix.translate(0, 1.5, 0);
    l.head[2].render();
    l.head[1].matrix.scale(0.6, 1, 1);
    l.head[1].matrix.translate(0, 0, -1.5);
    l.head[1].render();
    l.head[2].matrix.set(l.head[1].matrix);
    l.head[2].matrix.translate(0, 1.5, 0);
    l.head[2].render();
    l.head[3].color = darkGrey;
    l.head[3].matrix = new Matrix4(l.head[2].matrix);
    l.head[3].matrix.scale(0.9, 2, 1);
    l.head[3].matrix.translate(0, 1, 0);
    l.head[3].render();
    l.head[4].color = darkGrey;
    l.head[4].matrix = new Matrix4(l.head[3].matrix);
    l.head[4].matrix.scale(1.8, 1.5, 1.2);
    l.head[4].matrix.translate(0, 0, 1.5);
    l.head[4].render();
    l.head[5].color = darkGrey;
    l.head[5].matrix = new Matrix4(l.head[4].matrix);
    l.head[6].matrix = new Matrix4(l.head[4].matrix);
    l.head[5].matrix.rotate(-20, -1, 0, 1);
    l.head[5].matrix.scale(0.2, 0.4, 0.4);
    l.head[5].matrix.translate(3, 4, 1);
    l.head[6].color = darkGrey;
    l.head[6].matrix.rotate(20, 1, 0, 1);
    l.head[6].matrix.scale(0.2, 0.4, 0.4);
    l.head[6].matrix.translate(-3, 4, 1);
    l.head[5].render();
    l.head[6].render();
    var M2 = new Matrix4(l.head[4].matrix);
    M2.scale(0.6, 1.3, 1);
    M2.translate(1.3, 0.3, -1);
    eyes(M2, toothlessSchema.eye0);
    M2.translate(-2.6, 0, 0);
    eyes(M2, toothlessSchema.eye1);
}

function tail(M, l) {
    l[0].color = darkGrey;
    l[0].matrix.set(M);
    l[0].matrix.scale(0.4, 0.15, 0.4);
    l[0].matrix.translate(0, 0, -2);
    l[0].render();
    
    l[1].color = darkGrey;
    l[1].matrix.set(l[0].matrix);
    l[1].matrix.translate(0, 0, 2);
    l[1].matrix.scale(2.5, 6.67, 2.5);
    l[1].matrix.rotate(tjoint2, 0, 1, 0);
    l[1].matrix.rotate(tjointup, 1, 0, 0);
    l[1].matrix.scale(0.2, 0.15, 0.4);
    l[1].matrix.translate(0, 1, 0);
    l[1].render();
    
    l[2].color = darkGrey;
    l[2].matrix.set(l[1].matrix);
    l[2].matrix.translate(0, -1, 0);
    l[2].matrix.scale(5, 6.67, 2.5);
    l[2].matrix.rotate(10, 1, 0, 0);
    l[2].matrix.rotate(tjoint3, 0, 1, 0);
    l[2].matrix.rotate(tjointup-5, 1, 0, 0);
    l[2].matrix.scale(0.2, 0.15, 0.4);
    l[2].matrix.translate(0, 1, 2);
    l[2].render();
    
    l[3].color = darkGrey;
    l[3].matrix.set(l[2].matrix);
    l[3].matrix.translate(0, -1, -2);
    l[3].matrix.scale(5, 6.67, 2.5);
    l[3].matrix.rotate(15, 1, 0, 0);
    l[3].matrix.rotate(tjoint4, 0, 1, 0);
    l[3].matrix.rotate(tjointup-10, 1, 0, 0);
    l[3].matrix.scale(0.2, 0.15, 0.4);
    l[3].matrix.translate(0, 1, 4);
    l[3].render();
    
    l[4].color = darkGrey;
    l[4].matrix.set(l[3].matrix);
    l[4].matrix.scale(0.4, 0.7, 1);
    l[4].matrix.translate(0, 1, 2);
    l[4].render();
    
    l[5].color = darkGrey;
    l[5].matrix.set(l[4].matrix);
    l[5].matrix.scale(3, 0.6, 1.3);
    l[5].matrix.translate(-1, 0, 0);
    l[5].render();

    l[6].color = red;
    l[6].matrix.set(l[4].matrix);
    l[6].matrix.scale(3, 0.6, 1.3);
    l[6].matrix.translate(1, 0, 0);
    l[6].render();
}

function wings(M, flangl, l) {
    
    l[0].color = darkGrey;
    l[0].matrix.set(M);
    l[0].matrix.rotate(-45, 1, 0, 0);
    l[0].matrix.scale(0.1, 0.8, 0.1);
    l[0].render();

    toothelessCones[1].color = darkGrey;
    toothelessCones[1].matrix.set(l[0].matrix);
    toothelessCones[1].matrix.scale(2.5, 0.5, 2.5);
    toothelessCones[1].matrix.translate(0, 2, 0);
    toothelessCones[1].render();
    
    l[1].color = darkGrey;
    l[1].matrix.set(l[0].matrix);
    l[1].matrix.scale(0.8, 0.8, 6);
    l[1].matrix.translate(0, 0, -1);
    l[1].render();
    
    l[2].color = darkGrey;
    l[2].matrix.set(M);
    l[2].matrix.rotate(70-wingAngle, 1, 0, 0);
    l[2].matrix.rotate(flangl, 0, 0, -1);
    l[2].matrix.scale(0.1, 0.8, 0.1);
    l[2].matrix.translate(0, -1.5, -6);
    l[2].render();

    toothelessCones[0].color = darkGrey;
    toothelessCones[0].matrix.set(l[2].matrix);
    toothelessCones[0].matrix.rotate(180, 0, 0, 1);
    toothelessCones[0].matrix.scale(2.5, 1, 2.5);
    toothelessCones[0].matrix.translate(0, 1, 0);
    toothelessCones[0].render();
    
    l[3].color = darkGrey;
    l[3].matrix.set(l[2].matrix);
    l[3].matrix.scale(0.8, 0.8, 6);
    l[3].matrix.translate(0, 0, 1);
    l[3].render();
}

function eyes(M, l) {
    l[0].color = eyeColor;
    l[0].matrix.set(M);
    l[0].matrix.scale(0.3, 0.3, 0.15);
    l[0].render();
    l[1].color = black;
    l[1].matrix = new Matrix4(l[0].matrix);
    l[1].matrix.scale(0.6, 0.6, 0.6);
    l[1].matrix.translate(-0.2, 0.2, -1.5);
    l[1].render();
}






