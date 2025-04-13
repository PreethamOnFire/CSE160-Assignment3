var VSHADER_SOURCE =
    `attribute vec4 a_Position;
     attribute float a_Size;
     void main() {
       gl_Position = a_Position;
       gl_PointSize = a_Size;
     }`;

var FSHADER_SOURCE =
   `precision mediump float;
    uniform vec4 u_FragColor;                                     
    void main() {
      gl_FragColor = u_FragColor;                                                  
    }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let a_Size;

var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_selectedSize = 10.0;
var g_selectedShape = "point";
var g_selectedSegments = 10;
var g_LayerList = [[]];
var g_selectedLayer = 0;
var layersInner;

function HTMLActions(){
    document.getElementById("Red").addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; colorSquare() });
    document.getElementById("Blue").addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; colorSquare() });
    document.getElementById("Green").addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; colorSquare() });
    document.getElementById("Alpha").addEventListener('mouseup', function() {g_selectedColor[3] = this.value/100; colorSquare() });
    document.getElementById("size").addEventListener('mouseup', function() {g_selectedSize = this.value});
    document.getElementById("segments").addEventListener('mouseup', function() {g_selectedSegments = parseInt(this.value)});
    document.getElementById("shapes").addEventListener('mouseup', function() {g_selectedShape = this.value});
    document.getElementById("layerOptions").addEventListener('mouseup', function() {g_selectedLayer = this.value});
}

function colorSquare() {
    selector = document.getElementById("color-square");
    selector.style.backgroundColor = "rgba("+(g_selectedColor[0]*255)+","+(g_selectedColor[1]*255)+","+(g_selectedColor[2]*255)+","+g_selectedColor[3]+")";
}

function clearCanvas(){
    g_LayerList = [[]];
    var layerContainer = document.getElementById("layers");
    layerContainer.innerHTML = layersInner;
    g_selectedLayer = 0;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
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

    a_Size = gl.getAttribLocation(gl.program, 'a_Size');
    if (a_Size < 0) {
        console.log("Failed to get the location of a_Size");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log("Failed to get u_FragColor variable");
        return;
    }
}

function main() {
    layersInner = document.getElementById("layers").innerHTML;

    setupWebGL();


    connectVariablesToGLSL();

    g_selectedSize = document.getElementById("size").value;
    g_selectedColor = [document.getElementById("Red").value, document.getElementById("Green").value, document.getElementById("Blue").value, 1.0];

    HTMLActions();

    canvas.onmousedown = function(ev) { click(ev); };
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)}};

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.POINTS, 0, 1);
}

var g_ShapeList = [];
function click(ev){
    [x,y] = convertCoordinatesEventToGL(ev);
    switch(g_selectedShape) {
        case "point":
            var point = new Point();
            point.position = [x,y];
            break;
        case "triangle":
            var offset = g_selectedSize/100;
            var point = new Triangle([x, y+offset, x + offset, y-offset, x-offset, y-offset]);
            break;
        case "circle":
            var point = new Circle();
            point.position = [x,y];
            point.segments = g_selectedSegments;
            break;
    }
    point.size = g_selectedSize;
    point.color = g_selectedColor.slice();
    g_LayerList[g_selectedLayer].push(point);

    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return [x,y]
}

function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_LayerList.length;
    for (var i = 0; i < len; i++) {
        var shapes = g_LayerList[i].length;
            for (var j = 0; j < shapes; j++) {
                g_LayerList[i][j].render();
            }
    }
}

//Layer Func
function addLayer() {
    var collection = document.getElementById("layerList");
    const li = document.createElement("li");
    var num = parseInt(collection.children.length);
    li.textContent = "Layer " + (num);
    collection.appendChild(li);
    var options = document.getElementById("layerOptions");
    const op = document.createElement("option");
    op.text = "Layer " + (num);
    op.value = num;
    options.appendChild(op);
    g_LayerList.push([]);
}

function removeLayer() {
    var collection = document.getElementById("layerList");
    var options = document.getElementById("layerOptions");
    if (collection.children.length > 1) {
        collection.removeChild(collection.children[g_selectedLayer]);
        options.removeChild(options.children[g_selectedLayer]);
        g_LayerList.splice(g_selectedLayer, 1);
        for (var i = g_selectedLayer; i < options.children.length; i++){
            options.children[i].value -= 1;
            options.children[i].text = "Layer " + i;
            collection.children[i].textContent = "Layer " + i;
        }
        renderAllShapes();
    }
}


function drawPicture() {
    //Colors
    var white = [1.0, 1.0, 1.0, 1.0];
    var red = [1.0, 0, 0, 1.0];
    var grey = [0.5, 0.5, 0.5, 1.0];
    var grey2 = [0.2, 0.2, 0.2, 1.0];
    var grey3 = [0.7, 0.7, 0.7, 1.0];

    //Mouth
    var mt1 = new Triangle([0, 0, -0.1, 0, -0.1, -0.3]);
    var mt2 = new Triangle([0, 0, 0.1, 0, 0.1, -0.3]);
    mt1.color = grey2.slice();
    mt2.color = grey2.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    var t1 = new Triangle([0, 0, -0.05, 0, -0.025, -0.05]);
    var t2 = new Triangle([0, 0, 0.05, 0, 0.025, -0.05]);
    var t3 = new Triangle([-0.05, 0, -0.1, 0, -0.1, -0.1]);
    var t4 = new Triangle([0.05, 0, 0.1, 0, 0.1, -0.1]);
    t1.color = white.slice();
    t2.color = white.slice();
    t3.color = white.slice();
    t4.color = white.slice();
    g_LayerList[g_selectedLayer].push(t1);
    g_LayerList[g_selectedLayer].push(t2);
    g_LayerList[g_selectedLayer].push(t3);
    g_LayerList[g_selectedLayer].push(t4);
    t1 = new Triangle([0, -0.3, -0.05, -0.3, -0.025, -0.25]);
    t2 = new Triangle([0, -0.3, 0.05, -0.3, 0.025, -0.25]);
    t3 = new Triangle([-0.05, -0.3, -0.1, -0.3, -0.1, -0.2]);
    t4 = new Triangle([0.05, -0.3, 0.1, -0.3, 0.1, -0.2]);
    t1.color = white.slice();
    t2.color = white.slice();
    t3.color = white.slice();
    t4.color = white.slice();
    g_LayerList[g_selectedLayer].push(t1);
    g_LayerList[g_selectedLayer].push(t2);
    g_LayerList[g_selectedLayer].push(t3);
    g_LayerList[g_selectedLayer].push(t4);
    mt1 = new Triangle([-0.1, -0.3, -0.1, -0.4, 0.1, -0.3]);
    mt2 = new Triangle([-0.1, -0.3, 0.1, -0.3, 0.1, -0.4]);
    mt1.color = grey.slice();
    mt2.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([0, 0, -0.1, 0, 0, 0.1]);
    mt2 = new Triangle([0, 0, 0.1, 0, 0, 0.1]);
    mt1.color = grey.slice();
    mt2.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);

    //face
    mt1 = new Triangle([0.1, 0, 0.3, 0.3, 0, 0.3]);
    mt2 = new Triangle([-0.1, 0, -0.3, 0.3, 0, 0.3]);
    mt1.color = grey.slice();
    mt2.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([-0.3, 0.3, -0.5, 0.4, 0, 0.4]);
    mt2 = new Triangle([0.3, 0.3, 0.5, 0.4, 0, 0.4]);
    mt1.color = grey.slice();
    mt2.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([-0.5, 0.4, -0.6, 0.6, 0, 0.6]);
    mt2 = new Triangle([0.5, 0.4, 0.6, 0.6, 0, 0.6]);
    mt1.color = grey.slice();
    mt2.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([-0.6, 0.6, -0.5, 0.6, -0.5, 0.7]);
    mt2 = new Triangle([0.6, 0.6, 0.5, 0.6, 0.5, 0.7]);
    mt1.color = grey3.slice();
    mt2.color = grey3.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([-0.5, 0.4, 0, 0.6, 0.5, 0.4]);
    mt1.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    mt1 = new Triangle([0, 0.3, 0.4, 0.5, -0.4, 0.5]);
    mt2 = new Triangle([0, 0.5, 0.2, 0.65, -0.2, 0.65]);
    mt1.color = grey3.slice();
    mt2.color = grey3.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([-0.1, 0, 0, 0.1, 0, 0.3]);
    mt2 = new Triangle([0.1, 0, 0, 0.1, 0, 0.3]);
    mt1.color = grey3.slice();
    mt2.color = grey3.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);
    mt1 = new Triangle([0, 0.3, -0.3, 0.3, -0.15, 0.35]);
    mt2 = new Triangle([0, 0.3, 0.3, 0.3, 0.15, 0.35]);
    mt1.color = grey.slice();
    mt2.color = grey.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);


    //Outside Spikes
    t1 = new Triangle([-0.3, 0.3, -0.6, 0.1, -0.2, 0.1]);
    t2 = new Triangle([0.3, 0.3, 0.6, 0.1, 0.2, 0.1]);
    t3 = new Triangle([-0.3, 0.1, -0.4, -0.3, -0.1, 0.15]);
    t4 = new Triangle([0.3, 0.1, 0.4, -0.3, 0.1, 0.15]);
    t1.color = grey2.slice();
    t2.color = grey2.slice();
    t3.color = grey2.slice();
    t4.color = grey2.slice();
    g_LayerList[g_selectedLayer].push(t1);
    g_LayerList[g_selectedLayer].push(t2);
    g_LayerList[g_selectedLayer].push(t3);
    g_LayerList[g_selectedLayer].push(t4);
    t1 = new Triangle([-0.3, 0.3, -0.6, 0.3, -0.5, 0.4]);
    t2 = new Triangle([0.3, 0.3, 0.6, 0.3, 0.5, 0.4]);
    t1.color = grey2.slice();
    t2.color = grey2.slice();
    g_LayerList[g_selectedLayer].push(t1);
    g_LayerList[g_selectedLayer].push(t2);
    t1 = new Triangle([-0.1, 0, -0.2, 0, -0.2, -0.2]);
    t2 = new Triangle([0.1, 0, 0.2, 0, 0.2, -0.2]);
    t3 = new Triangle([-0.1, 0, -0.2, 0, -0.15, 0.07]);
    t4 = new Triangle([0.1, 0, 0.2, 0, 0.15, 0.07]);
    t1.color = grey2.slice();
    t2.color = grey2.slice();
    t3.color = grey2.slice();
    t4.color = grey2.slice();
    g_LayerList[g_selectedLayer].push(t1);
    g_LayerList[g_selectedLayer].push(t2);
    g_LayerList[g_selectedLayer].push(t3);
    g_LayerList[g_selectedLayer].push(t4);

    //Eyes
    mt1 = new Triangle([-0.1, 0.35, -0.25, 0.35, -0.25, 0.42]);
    mt2 = new Triangle([0.1, 0.35, 0.25, 0.35, 0.25, 0.42]);
    mt1.color = red.slice();
    mt2.color = red.slice();
    g_LayerList[g_selectedLayer].push(mt1);
    g_LayerList[g_selectedLayer].push(mt2);



    renderAllShapes();
}

