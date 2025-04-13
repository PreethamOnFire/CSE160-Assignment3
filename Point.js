class Point {
    constructor() {
        this.type="point";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.position = [0.0, 0.0, 0.0];
    }

    render() {
        var xy = this.position;
        var rgba = this.color;

        gl.disableVertexAttribArray(a_Position);
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        gl.vertexAttrib1f(a_Size, this.size);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}