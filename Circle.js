class Circle {
    constructor(){
        this.type="circle";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.position = [0.0, 0.0, 0.0];
        this.segments = 10;
    }

    render(){
        var xy = this.position;
        var rgba = this.color;
        var d = this.size/200.0;

        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        var vertices = [];
        vertices.push(xy[0]);
        vertices.push(xy[1]);

        for (var i = 1; i < this.segments+2; i++){
            var center = [xy[0], xy[1]];
            var vec = [Math.cos(i*(2*Math.PI/this.segments))*d, Math.sin(i*(2*Math.PI/this.segments))*d];
            var point1 = center[0] + vec[0];
            var point2 = center[1] + vec[1];
            vertices.push(point1);
            vertices.push(point2);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.vertexAttrib1f(a_Size, this.size);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.segments+2);
    }
}