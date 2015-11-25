// VECTOR DEFINITION
/**
 * algo_handler root namespace.
 *
 * @nameSpace algo_handler
 */
if (typeof vec3 == "undefined" || !vec3) {
    function vec3(){};
}

vec3.create = function() {
    var out = Array(3);
    out[0]=out[1]=out[2]=0;
    return out;
}

vec3.dot = function(a, b) {
    return (a[0]*b[0]+a[1]*b[1]+a[2]*b[2]);
}

vec3.cross = function(a,b){
    var out = Array(3);

    out[0] = a[1]*b[2] - a[2]*b[1];
    out[1] = a[2]*b[0] - a[0]*b[2];
    out[2] = a[0]*b[1] - a[1]*b[0];

    return out;
}

vec3.scale = function(a,s){
    var out = Array(3);
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
}

vec3.multiply = function(a,b){
    var out = Array(3);
    out[0] *= a[0] * b[0];
    out[1] *= a[1] * b[1];
    out[2] *= a[2] * b[2];
    return out;
}

vec3.add = function(a,b){
    var out = Array(3);
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
}

vec3.subtract = function(a,b){
    var out = Array(3);
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
}

vec3.size = function(a){
    return (Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]));
}

vec3.normalize = function(a){
    var out = Array(3);
    var size = vec3.size(a);
    out[0] = a[0] / size;
    out[1] = a[1] / size;
    out[2] = a[2] / size;
    return out;
}

//RAYTRACE OBJECT DEFINITION



// TODO : Find better places to put these consts
MAX_DISTANCE = Number.MAX_VALUE;   //constant only used as return and compare value when we don't collide with anything
SPHERE_EPSILON = .000000000000001;

//Defining a raytracer object
function Sphere(pos, rad, mats){
    this.position = pos;
    this.radius = rad;
    this.material = mats;
}

//given coordinates on sphere, get normal
Sphere.prototype.getNormal = function(coord){
    return ((coord - this.position)/this.radius);
}

//returns distance of intersectin
Sphere.prototype.testIntersection = function(eye, dir){
    var emc = vec3.subtract(eye,this.position);
    var d_d = vec3.dot(dir,dir);
    var pt1 = Math.pow(vec3.dot(dir, emc),2);
    var pt2 = d_d*(vec3.dot(emc,emc))-this.radius*this.radius;
    var discriminant = pt1 - pt2;
    if (discriminant<0){
        return MAX_DISTANCE;
    }

    t1 = (-(vec3.dot(dir,emc))+Math.sqrt(discriminant))/d_d;
    t2 = (-(vec3.dot(dir,emc))-Math.sqrt(discriminant))/d_d;

    if (t1<SPHERE_EPSILON && t2 < SPHERE_EPSILON){
        return MAX_DISTANCE
    }
    else if ( t1<SPHERE_EPSILON && t2>=SPHERE_EPSILON)
        return (t2)*(vec3.size(dir));
    else if ( t2<SPHERE_EPSILON && t1>=SPHERE_EPSILON)
        return (t1)*(vec3.size(dir));
    else {
        return (vec3.size(dir)*Math.min(t1,t2));
    }

}

//SCENE MANAGEMENT SECTION


//setting up scene
function Scene(entityList, light_list, cameraPos, yfov, forward, up, bgcolor){
    this.entities = entityList;
    this.lights = light_list;
    this.eye = cameraPos;
    this.gaze = vec3.normalize(forward);
    this.background_color = bgcolor;
    this.up = up;
    this.y_fov = yfov;
};


//test collissions with ray and any objects
Scene.prototype.testCollisions = function(eye, dir){
    //TODO : make octree
    var dist = MAX_DISTANCE;
    for (var i=0; i<this.entities.length; i++){
        var d = this.entities[i].testIntersection(eye,dir);
        if (d < dist){
            this.closest = this.entities[i];
            dist=d;
        }
    }
    return dist;
}

//return color given ray
Scene.prototype.rayTrace = function(eye, dir, recursionDepth){
    //could use good data structure here
    var dist = this.testCollisions(eye,dir);
    if (dist == MAX_DISTANCE)
        return (this.background_color);

    var new_pos = vec3.add(eye, vec3.multiply(dir, dist));
    var collide_obj = this.closest;
    var normal = collide_obj.getNormal(new_pos);
    
    var color = [0,0,0];
    //this is where you can add shading and lighting and stuff
    color = vec3.add(color, collide_obj.material.ambient);

    //TODO : Add diffuse lighting

    //diffuse light
    //for (var i=0; i<this.lights.length; i++){
    //    //see if there is a path to the light
    //}
    //color = vec3.scale(color, 1/Math.max(color[0],color[1],color[2]));  //normalize to make our max color 1
    // TODO : Add specular shading
    return vec3.scale(color, 256);  //multiply color intensities by 256 before returning so its in screen format
}

//ACTUAL SCENE CREATION
//
//Making Spheres and adding it to our entity list
var sphere1 = new Sphere([-5,0,20], 2, {ambient: [1,0,0], specular : [.5, .2, .2]});
var sphere2 = new Sphere([2,0,10],  2, {ambient: [0,1,0], specular : [.2, .5, .25]});
var sphere3 = new Sphere([0,0,15],  2, {ambient: [0,0,1], specular : [.1, .1, .2]});
mySpheres = [sphere1, sphere2, sphere3];

//Making light(s) and adding to light list
var light1 = {pos : [-4, 8, 15], color: [1, 1, 1]}
var light2 = {pos : [8, 10, 30], color: [1, 1, 1]}

lights = [light1, light2];

myScene = new Scene(mySpheres, lights, [0,0,0], 45, [0,0,1], [0,1,0], [15,15,70]);

//SCREEN MANAGEMENT SECTION

//helper function for setting pixel info)
function setPixel(imgDat, x, y, color){
    var index = (x + y * imgDat.width) * 4;
    imgDat.data[index + 0]   =   color[0];   //r
    imgDat.data[index + 1]   =   color[1];   //g
    imgDat.data[index + 2]   =   color[2];   //b
    imgDat.data[index + 3]   =   255;        //a, opaque
}

//main
window.onload = function()
{
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    //stuff
    width  = canvas.width;
    height = canvas.height;
    var gaze  = myScene.gaze;
    var up = myScene.up;
    var fovy = myScene.y_fov*3.1416/180; //from degrees to radians
    var eye = myScene.eye;
    //get other stuff necessary to compute
    var gaze_len = height/(2*Math.tan(fovy/2)); //get length of gaze
    //get unit vectors for left, down, right
    var left  = vec3.cross(up,gaze);
    var right = vec3.cross(gaze,up);
    var down = vec3.scale(up, -1);
    
    //now compute the top left vector
    var top_left = vec3.add(vec3.add(vec3.scale(up, height/2), vec3.scale(left,width/2)),vec3.scale(gaze,gaze_len));

    //create frame, not really taking advantage of alpha channel atm
    //but could be done by drawing over
    imageData = ctx.createImageData(width, height); //rgba buffer
    for (var x = 0; x < width; x++)
    {
        for (var y = 0; y < height; y++)
        {
            var dir = vec3.add(top_left,vec3.add(vec3.scale(right,x), vec3.scale(down,y)));
            color   = myScene.rayTrace(eye, vec3.normalize(dir), 0);
            setPixel(imageData,x,y,color);
        }
        //console.log(x);
    }

    ctx.putImageData(imageData,0,0);
}

