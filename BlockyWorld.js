var VSHADER_SOURCE =
    `attribute vec4 a_Position;
     attribute float a_Size;
     attribute vec4 a_Color;
     attribute mat4 u_ModelMatrix;
     attribute vec3 a_Normalv;
     attribute vec2 a_Uv;
     uniform mat4 u_ViewMatrix;
     uniform mat4 u_ProjectionMatrix;

     attribute float a_UVMult;
     attribute float a_texColorWeight;
     attribute float a_texSelector;

     varying lowp vec4 vColor;
     varying vec3 vNormal;
     varying highp vec2 v_Uv;
     varying float v_texSelector;
     varying float v_texColorWeight;

     void main() {
       gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
       gl_PointSize = a_Size;
       vColor = a_Color;
       vNormal = a_Normalv;
       v_Uv = a_Uv * a_UVMult;
       v_texSelector = a_texSelector;
       v_texColorWeight = a_texColorWeight;
     }`;

var FSHADER_SOURCE =
   `precision mediump float;

    uniform vec4 u_FragColor;
    uniform vec3 u_reverseLightDirection;

    uniform sampler2D texture0;
    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform sampler2D texture3;
    uniform sampler2D texture4;

    varying float v_texSelector;
    varying float v_texColorWeight;

    varying vec3 vNormal; 
    varying lowp vec4 vColor;
    varying highp vec2 v_Uv;                                    
    void main() {
      vec3 normal = normalize(vNormal);
      vec4 image0; 
      if (v_texSelector < 0.5) {
        image0 = texture2D(texture0, v_Uv);
      } else if (v_texSelector < 1.5) {
        image0 = texture2D(texture1, v_Uv);
      } else if (v_texSelector < 2.5) {
        image0 = texture2D(texture2, v_Uv);
      } else if (v_texSelector < 3.5) {
        image0 = texture2D(texture3, v_Uv); 
      } else {
        image0 = texture2D(texture4, v_Uv); 
      }
      gl_FragColor = (1.0 - v_texColorWeight) * vColor +  v_texColorWeight*image0;
      float light = dot(normal, u_reverseLightDirection);
      //gl_FragColor.rgb *= light;
    }`;

let canvas;
let gl;
let camera;
let a_Position;
let u_FragColor;
let a_Size;
let u_ModelMatrix;
let a_Color;
let a_Normalv;
let u_reverseLightDirection;
let u_ProjectionMatrix;
let u_ViewMatrix;
let a_Uv;
let a_texColorWeight;
let a_texSelector;
let a_UVMult;

// Colors
let darkGrey = [0.3, 0.3, 0.3, 1.0];
let black = [0.1, 0.1, 0.1, 1.0];
let white = [1.0, 1.0, 1.0, 1.0];
let eyeColor = [0.1, 1.0, 0.05, 1.0];
let red = [1.0, 0, 0, 1.0];
let groundColor = [0.48, 0.99, 0, 1.0];
let sky = [0.53, 0.81, 0.92, 1.0];

let matrixBuffers = {
    groundBuffer: null,
    skyBuffer: null,
    wallBuffer: null,
}

let colorBuffers = {
    groundBuffer: null,
    skyBuffer: null,
    wallBuffer: null,
}

var g_globalAngle = 0;
var g_globalAngleX = 0;
var g_globalZoom = 1;

// MouseControl for rotate
var isMouseDown = false;
var initialX = 0;
var changeX = 0;

let desk;

// ext
let ext;

var map = [ [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
            [4, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 0, 3, 0, 0, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 0, 3, 3, 3, 4],
            [4, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 4],
            [4, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4],
            [4, 0, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 4],
            [4, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 4],
            [4, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 3, 3, 3, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4],
            [4, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
            [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        ];


function initCubeBuffers() {
    var verticies = new Float32Array([
        // Front face
        -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
          
        // Back face
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
      
        // Top face
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
      
        // Bottom face
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
      
        // Right face
        1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
      
        // Left face
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
    ]);
    var indicies = new Uint16Array([
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ]);
    var cubeNormals = new Float32Array ([
        // Front
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    
        // Back
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    
        // Top
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    
        // Bottom
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
    
        // Right
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    
        // Left
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ]);
    var textureCoordinates = new Float32Array ([
        // Front
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Back
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Top
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Bottom
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Right
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
        // Left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ]);
    matrixBuffers.groundBuffer = gl.createBuffer();
    if (!matrixBuffers.groundBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    matrixBuffers.skyBuffer = gl.createBuffer();
    if (!matrixBuffers.skyBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    matrixBuffers.wallBuffer = gl.createBuffer();
    if (!matrixBuffers.wallBuffer) {
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

    colorBuffers.groundBuffer = gl.createBuffer();
    if (!colorBuffers.groundBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    colorBuffers.skyBuffer = gl.createBuffer();
    if (!colorBuffers.skyBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    colorBuffers.wallBuffer = gl.createBuffer();
    if (!colorBuffers.wallBuffer) {
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

    cubeUVBuffer = gl.createBuffer();
    if (!cubeUVBuffer) {
        console.log('Failed to create buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
}

function loadObjData(objData) {
    console.log(objData);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.vertex), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.normalsverts), gl.STATIC_DRAW);

    var UvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, UvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.textures), gl.STATIC_DRAW);


    var colorBuffer = gl.createBuffer();
    var matrixBuffer = gl.createBuffer();

    return {
        vertexBuffer,
        normalBuffer,
        UvBuffer,
        numVertex: objData.vertex.length/3,
        colorBuffer,
        matrixBuffer,
    };
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
    document.onkeydown = keydown;
    document.addEventListener("mousemove", (event) => mouseMove(event));
    document.addEventListener("mousedown", (event) => mouseClicked(event));
}

function keydown(ev) {
    switch(ev.keyCode) {
        case 87:
            camera.moveForward();
            break;
        case 65:
            camera.moveLeft();
            break;
        case 68:
            camera.moveRight();
            break;
        case 83:
            camera.moveBackwards();
            break;
        case 69:
            camera.panRight();
            break;
        case 81:
            camera.panLeft();
            break;
    }
    renderAllShapes();
}

function mouseMove(event) {
    if (camera) {
        camera.handleMouseMove(event);
        renderAllShapes();
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


    // u_reverseLightDirection = gl.getUniformLocation(gl.program, 'u_reverseLightDirection');
    // if (!u_reverseLightDirection) {
    //     console.log("Failed to get the location u_GlobalModelMatrix");
    //     return;
    // }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log("Failed to get the location u_ViewMatrix");
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log("Failed to get the location u_ProjectionMatrix");
        return;
    }

    a_Uv = gl.getAttribLocation(gl.program, 'a_Uv');
    if (a_Uv < 0) {
        console.log("Failed to get the location of a_Size");
        return;
    }

    a_texColorWeight = gl.getAttribLocation(gl.program, 'a_texColorWeight');
    if (!a_texColorWeight) {
        console.log("Failed to get the location u_ProjectionMatrix");
        return;
    }

    a_texSelector = gl.getAttribLocation(gl.program, 'a_texSelector');
    if (!a_texSelector) {
        console.log("Failed to get the location u_ProjectionMatrix");
        return;
    }

    a_UVMult = gl.getAttribLocation(gl.program, 'a_UVMult');
    if (!a_UVMult) {
        console.log("Failed to get the location u_ProjectionMatrix");
        return;
    }
}

function main() {

    setupWebGL();

    camera = new Camera();
    camera.eye.elements[0] = -2;
    camera.eye.elements[2] = 20;
    initCubeBuffers();

    HTMLActions();

    connectVariablesToGLSL();
    loadCubeTextures();

    gl.clearColor(0.53, 0.81, 0.92, 1.0);
    //initializeCubes();
    buildMap();
    requestAnimationFrame(tick);
}   

function mouseClicked(event) {
    if (event.button === 0) {
        deleteBlock();
    } else if (event.button === 1) {
        placeBlock();
    }
}

function placeBlock() {
    var x = camera.eye.elements[0];
    var z = camera.eye.elements[2];
    var x = parseInt((x / 2) + 16);
    var z = parseInt((z / 2) + 16);
    var f = new Vector3();
    f.set(camera.at);
    f.sub(camera.eye);
    var absx = Math.abs(f.elements[0]);
    var absz = Math.abs(f.elements[2]);
    if (absx > absz) {
        if (f.elements[0] > 0) {
            map[z][x+1]++;
        } else {
            map[z][x-1]++;
        }
    } else {
        if (f.elements[2] > 0) {
            map[z+1][x]++;
        } else {
            map[z-1][x]++;
        }
    }
    buildMap();
    renderAllShapes();
}


function deleteBlock() {
    var x = camera.eye.elements[0];
    var z = camera.eye.elements[2];
    var x = parseInt((x / 2) + 16);
    var z = parseInt((z / 2) + 16);
    var f = new Vector3();
    f.set(camera.at);
    f.sub(camera.eye);
    var absx = Math.abs(f.elements[0]);
    var absz = Math.abs(f.elements[2]);
    if (absx > absz) {
        if (f.elements[0] > 0) {
            if (map[z][x+1] != 0){
                map[z][x+1]--;
                buildMap();
            }
        } else {
            if (map[z][x-1] != 0){
                map[z][x-1]--;
                buildMap();
            }
        }
    } else {
        if (f.elements[2] > 0) {
            if (map[z+1][x] != 0){
                map[z+1][x]--;
                buildMap();
            }
        } else {
            if (map[z-1][x] != 0){
                map[z-1][x]--;
                buildMap();
            }
        }
    }
    renderAllShapes();
}

function buildMap() {
    var platform = new Cube();
    var wallMatrices = [];
    var wallColor = [];
    var M  = new Matrix4();
    platform.matrix.set(M);
    platform.matrix.scale(32, 0.1, 32);
    platform.matrix.translate(0, -12, 0);
    wallColor = wallColor.concat(white);
    wallColor.push(1.0); 
    wallColor.push(0.0);
    wallColor.push(16.0);
    wallMatrices = wallMatrices.concat(Array.from(platform.matrix.elements));
    wallCubeCount++;
    platform.matrix.set(M);
    platform.matrix.scale(50, 50, 50);
    wallMatrices = wallMatrices.concat(Array.from(platform.matrix.elements));
    wallColor = wallColor.concat(sky);
    wallColor.push(0.0); 
    wallColor.push(0.0);
    wallColor.push(1.0);
    wallCubeCount++;

    wallCubeCount = 0;
    for (let i = 0; i < 32; i++) {
        for (let j = 0; j < 32; j++) {
            if (map[i][j] != 0) {
                for (k = 0; k < map[i][j]; k++) {
                    let w = new Cube();
                    w.matrix.translate(2*(j-16), k*2, 2*(i-16));
                    wallMatrices = wallMatrices.concat(Array.from(w.matrix.elements));
                    wallColor = wallColor.concat(black);
                    if (i == 0 || i == 31 || j == 0 || j == 31) {
                        wallColor.push(1.0); //ColorWeight
                        wallColor.push(2.0); //textureSelect
                        wallColor.push(1.0); //timestorepeat
                    } else if ((i > 0 && i < 9) && (j > 23 && j < 27)) {
                        wallColor.push(0.0); //ColorWeight
                        wallColor.push(1.0); //textureSelect
                        wallColor.push(1.0); //timestorepeat
                    } else if ((i > 11 && i < 17) && (j > 16 && j < 26)) {
                        wallColor.push(1.0); //ColorWeight
                        wallColor.push(2.0); //textureSelect
                        wallColor.push(1.0); //timestorepeat
                    } else {
                        wallColor.push(1.0); //ColorWeight
                        wallColor.push(1.0); //textureSelect
                        wallColor.push(1.0); //timestorepeat
                    }
                    wallCubeCount++;
                }
            } else {
                if (i < 27 || j < 9) {
                    let w = new Cube();
                    w.matrix.translate(2*(j-16), 3*2, 2*(i-16));
                    wallMatrices = wallMatrices.concat(Array.from(w.matrix.elements));
                    wallColor = wallColor.concat(black);
                    if ((i > 0 && i < 9) && (j > 23 && j < 27)) {
                        wallColor.push(0.0); //ColorWeight
                        wallColor.push(3.0); //textureSelect
                        wallColor.push(1.0); //timestorepeat
                    } else {
                        wallColor.push(1.0); //ColorWeight
                        wallColor.push(3.0); //textureSelect
                        wallColor.push(1.0); //timestorepeat
                    }
                    wallCubeCount++;
                }
            }
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffers.wallBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wallMatrices), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffers.wallBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wallColor), gl.DYNAMIC_DRAW);

    //Objects
    var deskData = new Obj();
    deskData.loadOBJ("./assets/desk.obj").then(() => {
        var count = 21;
        var M = new Matrix4();
        desk = loadObjData(deskData);
        var deskMatrixList = [];
        var deskMatrix = new Matrix4();
        deskMatrix.translate(2*(7-16), -1.5, 2*(10-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
        deskMatrix.set(M);
        deskMatrix.translate(2*(5.6-16), -1.5, 2*(11.2-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(90, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
        deskMatrix.set(M);
        deskMatrix.translate(2*(6.5-16), -1.5, 2*(12.8-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(180, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
        deskMatrix.set(M);
        deskMatrix.translate(2*(8-16), -1.5, 2*(11.5-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(270, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));

        deskMatrix.set(M);
        deskMatrix.translate(2*(19-16), -1.5, 2*(14-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(90, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
        deskMatrix.set(M);
        deskMatrix.translate(2*(22-16), -1.5, 2*(14-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(90, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));

        for (let i = 0; i < 3; i++) {
            deskMatrix.set(M);
            deskMatrix.translate(2*(15-16), -1.5, 2*((7 - 2*i)-16));
            deskMatrix.scale(0.1, 0.1, 0.1);
            deskMatrix.rotate(90, 0, 1, 0);
            deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
            deskMatrix.set(M);
            deskMatrix.translate(2*(17-16), -1.5, 2*((7 - 2*i)-16));
            deskMatrix.scale(0.1, 0.1, 0.1);
            deskMatrix.rotate(90, 0, 1, 0);
            deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
            deskMatrix.set(M);
            deskMatrix.translate(2*(19-16), -1.5, 2*((7 - 2*i)-16));
            deskMatrix.scale(0.1, 0.1, 0.1);
            deskMatrix.rotate(90, 0, 1, 0);
            deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
            deskMatrix.set(M);
            deskMatrix.translate(2*(21-16), -1.5, 2*((7 - 2*i)-16));
            deskMatrix.scale(0.1, 0.1, 0.1);
            deskMatrix.rotate(90, 0, 1, 0);
            deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));
        }

        deskMatrix.set(M);
        deskMatrix.translate(2*(9-16), -1.5, 2*(24-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(90, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));

        deskMatrix.set(M);
        deskMatrix.translate(2*(2-16), -1.5, 2*(29-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrix.rotate(180, 0, 1, 0);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));

        deskMatrix.set(M);
        deskMatrix.translate(2*(6.5-16), -1.5, 2*(28-16));
        deskMatrix.scale(0.1, 0.1, 0.1);
        deskMatrixList = deskMatrixList.concat(Array.from(deskMatrix.elements));

        var deskColor = [];
        for (let i = 0; i < count; i++) {
            deskColor = deskColor.concat(white);
            deskColor.push(1.0); //ColorWeight
            deskColor.push(4.0); //textureSelect
            deskColor.push(1.0); //timestorepeat
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, desk.matrixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(deskMatrixList), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, desk.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(deskColor), gl.STATIC_DRAW);
    })
}

var wallCubeCount;

var startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - startTime;

function tick() {
    renderAllShapes();
    g_seconds = performance.now()/1000.0 - startTime;
    // updateAnimation();

    requestAnimationFrame(tick);
}

function loadCubeTextures() {
    var floorTexture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var u_texture0 = gl.getUniformLocation(gl.program, "texture0");
    const img = new Image();
    img.onload = () => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(u_texture0, 0);
    };
    img.crossOrigin = "anonymous";
    img.src = "./assets/leaf-green-roll-carpet-7pd5n620144hu-64_600_11zon.jpeg";

    var wallTexture = gl.createTexture();
    var u_texture1 = gl.getUniformLocation(gl.program, "texture1");
    const img1 = new Image();
    img1.onload = () => {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, wallTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img1
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(u_texture1, 1);
    };
    img1.crossOrigin = "anonymous";
    img1.src = "./assets/AdobeStock_182702106_11zon.jpeg";

    var stoneTexture = gl.createTexture();
    var u_texture2 = gl.getUniformLocation(gl.program, "texture2");
    const img2 = new Image();
    img2.onload = () => {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, stoneTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img2,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(u_texture2, 2);
    };
    img2.crossOrigin = "anonymous";
    img2.src = "./assets/4784_11zon.jpg";

    var ceilingTexture = gl.createTexture();
    var u_texture3 = gl.getUniformLocation(gl.program, "texture3");
    const img3 = new Image();
    img3.onload = () => {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, ceilingTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img3,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(u_texture3, 3);
    };
    img3.crossOrigin = "anonymous";
    img3.src = "./assets/11zon_resized.jpg";

    var deskTexture = gl.createTexture();
    var u_texture4 = gl.getUniformLocation(gl.program, "texture4");
    const img4 = new Image();
    img4.onload = () => {
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, deskTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img4,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(u_texture4, 4);
    };
    img4.crossOrigin = "anonymous";
    img4.src = "./assets/faded-beige-wooden-textured-flooring-background_11zon.jpg";
}

function drawAllCubes(matrixBuffer, colorBuffer, count) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeUVBuffer);
    gl.vertexAttribPointer(a_Uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Uv);

    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);

    const bytesPerMatrix = 4*16;
    for (let i=0; i < 4; ++i) {
        const loc = u_ModelMatrix + i;
        gl.enableVertexAttribArray(loc);
        const offset = i*16;
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, offset);
        ext.vertexAttribDivisorANGLE(loc, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
    gl.vertexAttribPointer(a_Normalv, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normalv);

    const FSIZE = 4;

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(a_Color);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 7*FSIZE, 0);
    ext.vertexAttribDivisorANGLE(a_Color, 1);

    gl.enableVertexAttribArray(a_texColorWeight);
    gl.vertexAttribPointer(a_texColorWeight, 1, gl.FLOAT, false, 7*FSIZE, 4*FSIZE);
    ext.vertexAttribDivisorANGLE(a_texColorWeight, 1);

    gl.enableVertexAttribArray(a_texSelector);
    gl.vertexAttribPointer(a_texSelector, 1, gl.FLOAT, false, 7*FSIZE, 5*FSIZE);
    ext.vertexAttribDivisorANGLE(a_texSelector, 1);

    gl.enableVertexAttribArray(a_UVMult);
    gl.vertexAttribPointer(a_UVMult, 1, gl.FLOAT, false, 7*FSIZE, 6*FSIZE);
    ext.vertexAttribDivisorANGLE(a_UVMult, 1);

    // var lightDirection = new Vector3([-2, 4, -1.5]);
    // gl.uniform3fv(u_reverseLightDirection, new Float32Array(lightDirection.normalize().elements));


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    ext.drawElementsInstancedANGLE(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, count);
}

function drawObjects(obj, count) {
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.UvBuffer);
    gl.vertexAttribPointer(a_Uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Uv);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.matrixBuffer);

    const bytesPerMatrix = 4*16;
    for (let i=0; i < 4; ++i) {
        const loc = u_ModelMatrix + i;
        gl.enableVertexAttribArray(loc);
        const offset = i*16;
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, offset);
        ext.vertexAttribDivisorANGLE(loc, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.vertexAttribPointer(a_Normalv, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normalv);

    const FSIZE = 4;

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
    gl.enableVertexAttribArray(a_Color);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 7*FSIZE, 0);
    ext.vertexAttribDivisorANGLE(a_Color, 1);

    gl.enableVertexAttribArray(a_texColorWeight);
    gl.vertexAttribPointer(a_texColorWeight, 1, gl.FLOAT, false, 7*FSIZE, 4*FSIZE);
    ext.vertexAttribDivisorANGLE(a_texColorWeight, 1);

    gl.enableVertexAttribArray(a_texSelector);
    gl.vertexAttribPointer(a_texSelector, 1, gl.FLOAT, false, 7*FSIZE, 5*FSIZE);
    ext.vertexAttribDivisorANGLE(a_texSelector, 1);

    gl.enableVertexAttribArray(a_UVMult);
    gl.vertexAttribPointer(a_UVMult, 1, gl.FLOAT, false, 7*FSIZE, 6*FSIZE);
    ext.vertexAttribDivisorANGLE(a_UVMult, 1);

    // var lightDirection = new Vector3([-2, 4, -1.5]);
    // gl.uniform3fv(u_reverseLightDirection, new Float32Array(lightDirection.normalize().elements));


    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, obj.numVertex, count);
}

function renderAllShapes() {
    var startTime = performance.now();
 
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawAllCubes(matrixBuffers.wallBuffer, colorBuffers.wallBuffer, wallCubeCount);
    if (desk) {
        drawObjects(desk, 21);
    }
    var duration = performance.now() - startTime;
    document.getElementById("performance").textContent = "ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration);
}









