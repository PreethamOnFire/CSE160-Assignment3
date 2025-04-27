let coneVerticies = [];
let coneIndicies = [];
let coneNormals = [];
let coneColors = [];
let coneMatrices = [];
let coneVertexBuffer;
let coneIndexBuffer;
let coneNormalsBuffer;
let coneMatrixBuffer;
let coneColorBuffer;

const segments = 10;
const radius = 0.5;

class Cone {
    constructor(){
        this.type="cube";
        this.color = [1.0, 0, 0, 0];
        this.matrix = new Matrix4();
    }

    render() {
        coneColors = coneColors.concat(this.color);
        for (let i = 0; i < this.matrix.elements.length; i++) {
            coneMatrices.push(this.matrix.elements[i]);
        }
    }
}

function generateConeVerticies() {
    coneVerticies.push(0.0, 1.0, 0.0); //apex
    coneVerticies.push(0.0, 0.0, 0.0); //base
    for (let i = 0; i < segments; i++) {
        const theta  = i * 2 * Math.PI / segments;
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);
        coneVerticies.push(x, 0.0, z);
    }
}

function generateConeIndicies() {
    for(let i = 0; i < segments; i++) {
        coneIndicies.push(1);
        coneIndicies.push(2 + ((i+1)%segments));
        coneIndicies.push(2+i);
    }
    for(let i = 0; i < segments; i++) {
        coneIndicies.push(0);
        coneIndicies.push(2+i);
        coneIndicies.push(2 + ((i+1)%segments));
    }
}

function generateConeNormals() {
    coneNormals.push(0, -1, 0);
    for (let i = 0; i < segments; i++) {
        coneNormals.push(0, -1, 0);
    }
    for (let i = 0; i < segments; i++) {
        const theta  = i * 2 * Math.PI / segments;
        var nx = Math.cos(theta);
        var nz = Math.sin(theta);
        var ny = radius/1;
        coneNormals.push(nx, ny, nz);
    }
}



