class Camera {
    constructor() {
        this.fov = 100;
        this.eye = new Vector3([0, 0, 0]);
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);
        this.lastX = 0;
        this.lastY = 0;
        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
                                  this.at.elements[0], this.at.elements[1], this.at.elements[2],
                                  this.up.elements[0], this.up.elements[1], this.up.elements[2],);
        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(this.fov, canvas.width/canvas.height, 0.1, 1000);
    }

    moveForward() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(0.1);
        this.eye.add(f);
        this.at.add(f);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }

    moveBackwards() {
        var b = new Vector3();
        b.set(this.at);
        b.sub(this.eye);
        b.normalize();
        b.mul(0.1);
        this.eye.sub(b);
        this.at.sub(b);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }

    moveLeft() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var s = Vector3.cross(this.up, f);
        s.normalize();
        s.mul(0.1);
        this.eye.add(s);
        this.at.add(s);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }

    moveRight() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var s = Vector3.cross(f, this.up);
        s.normalize();
        s.mul(0.1);
        this.eye.add(s);
        this.at.add(s);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }

    panLeft() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(5, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotationMatrix.multiplyVector3(f);
        f.set(this.eye);
        f.add(f_prime);
        this.at.set(f);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }

    panRight() {
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        var rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-5, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotationMatrix.multiplyVector3(f);
        f.set(this.eye);
        f.add(f_prime);
        this.at.set(f);
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }

    handleMouseMove(event) {
        var deltaX = event.clientX - this.lastX;
        var deltaY = event.clientY - this.lastY;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        var f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);

        var rotationMatrixX = new Matrix4();
        var rotationMatrixY = new Matrix4();
        rotationMatrixY.setRotate(-deltaX * 0.5, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotationMatrixY.multiplyVector3(f);

        var rightVector = Vector3.cross(f_prime, this.up);
        rightVector.normalize();

        rotationMatrixX.setRotate(-deltaY * 0.5, rightVector.elements[0], rightVector.elements[1], rightVector.elements[2]);
        f_prime = rotationMatrixX.multiplyVector3(f_prime);
        f.set(this.eye);
        f.add(f_prime);
        this.at.set(f);

        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2],);
    }
}
