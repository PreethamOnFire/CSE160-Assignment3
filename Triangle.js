class Triangle {
    constructor(verticies){
        this.type="triangle";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.verticies = verticies;
    }

    render(){
        var rgba = this.color;

        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verticies), gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.vertexAttrib1f(a_Size, this.size);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}