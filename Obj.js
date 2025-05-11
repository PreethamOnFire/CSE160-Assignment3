class Obj {
    constructor() {
        this.vertex = [];
        this.textures = [];
        this.normalsverts = [];
    }
    async loadOBJ(url) {
        const response = await fetch(url);
        const text = await response.text();
        var data = this.parseObj(text);
        this.vertex = data.verticies;
        this.textures = data.textUV;
        this.normalsverts = data.normals;
    }

    parseObj(src) {
        var tempVert = [];
        var tempUV = [];
        var tempNorm = [];

        var verticies = [];
        var textUV = [];
        var normals = [];
        
        const lines = src.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            var line = lines[i];
            var parts = line.split(/\s+/);

            if (line.startsWith('v ')) {
                tempVert.push(
                    {
                        x: parseFloat(parts[1]),
                        y: parseFloat(parts[2]),
                        z: parseFloat(parts[3]),
                    });
            } else if (line.startsWith('vt ')) {
                tempUV.push({
                    x: parseFloat(parts[1]),
                    y: parseFloat(parts[2]),
                });
            } else if (line.startsWith('vn ')) {
                tempNorm.push(
                    {
                        x: parseFloat(parts[1]),
                        y: parseFloat(parts[2]),
                        z: parseFloat(parts[3]),
                    });
            } else if (line.startsWith('f ')) {
                for (let i = 1; i < 4; i++) {
                    var part = parts[i].split('/');
                    var v1 = parseInt(part[0])-1;
                    var t1 = parseInt(part[1])-1;
                    var n1 = parseInt(part[2])-1;
                    verticies.push(tempVert[v1].x, tempVert[v1].y, tempVert[v1].z);
                    textUV.push(tempUV[t1].x, tempUV[t1].y);
                    normals.push(tempNorm[n1].x, tempNorm[n1].y, tempNorm[n1].z);
                }
            }
        }
        return {
            verticies,
            textUV,
            normals
        };
    }

}