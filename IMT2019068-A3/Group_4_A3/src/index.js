// Imports for shaders
import ProgramCreator from './lib/programCreator.js';
import { PhongVertexShaderSrc } from './Shaders/Phong/vertex.js';
import { PhongFragmentShaderSrc } from './Shaders/Phong/fragment.js';
import { GouradVertexShaderSrc } from './Shaders/Gourad/vertex.js';
import { GouradFragmentShaderSrc } from './Shaders/Gourad/fragment.js';

// Imports for object rendering, tranformations and light behavior
import { vec3, mat4, quat } from 'https://cdn.skypack.dev/gl-matrix';
import objLoader from 'https://cdn.skypack.dev/webgl-obj-loader';
import Mesh from './lib/Mesh.js';
import Renderer from './lib/renderer.js';

var cameraParams = {
    eye: {
        x: 0,
        y: 0,
        z: 30,
    },
    
    center: {
        x: 0,
        y: 0,
        z: 0,
    },
    
    up: {
        x: 0,
        y: 1,
        z: 0,
    },
    
    radius: 30,
}

var cameraX = Math.PI / 1000, cameraY = Math.PI / 1000;

var projectVal = 
{
    fovy: Math.PI/3,
    aspect: window.innerWidth/ window.innerHeight,
    near: 1,
    far: 2000
}

const renderer = new Renderer();
const gl = renderer.getGlContext();
const phongShaderCode = new ProgramCreator(gl, PhongVertexShaderSrc, PhongFragmentShaderSrc);
const gouradShaderCode = new ProgramCreator(gl, GouradVertexShaderSrc, GouradFragmentShaderSrc);

var Red = {
    ka : 0.9, 
    kd : 0.9, 
    ks : 0.03,

    Ambientcolor : vec3.fromValues(0.0, 0.0, 0.0),
    DiffuseColor : vec3.fromValues(0.78, 0.1, 0.23),
    SpecularColor : vec3.fromValues(0.8, 0.59, 0.5),
    
    Shine : 800,
    Limit : Math.PI / 9
}


var Green = {
    ka : 0.1,
    kd : 0.3,
    ks : 0.07,

    Ambientcolor : vec3.fromValues(0, 0, 0.6),
    DiffuseColor : vec3.fromValues(0.78, 0.1, 0.23),
    SpecularColor : vec3.fromValues(0.8, 0.59, 0.5),

    Shine : 800,
    Limit : Math.PI / 9
}

var meshes = [];

var TeapotRead=false;
var TeapotColor = new Float32Array([0.3, 0, 0.9, 1.0]);
var TeapotScaling = 0.5;
var TeapotMesh;
var TeapotPosition = vec3.fromValues(-10, 5, 0);

fetch('./models/teapot.obj')
    .then(response => response.text())
    .then(data => {
        TeapotMesh = new Mesh(gl, 
            JSON.parse(JSON.stringify(new objLoader.Mesh(data))), 
            projectVal, 
            TeapotColor, 
            cameraParams, 
            TeapotScaling,
            0);
        TeapotMesh.setLightAttrs(Green);

        TeapotMesh.transform.setTranslate(TeapotPosition);
        TeapotMesh.transform.updateMVPMatrix();
        TeapotRead = true;
        meshes.push(TeapotMesh);
    })

var SphereRead=false;
var SphereMesh;
var SphereColor = new Float32Array([0.5, 0.0, 0, 1.0]);
var SphereScaling = 6;
var SpherePosition = vec3.fromValues(15, -0.5, 0) 
fetch('./models/sphere.obj')
    .then(response => response.text())
    .then(data => {
        SphereMesh = new Mesh(gl, 
            JSON.parse(JSON.stringify(new objLoader.Mesh(data))), 
            projectVal, 
            SphereColor, 
            cameraParams, 
            SphereScaling,
            2);
        SphereMesh.setLightAttrs(Red);

        SphereMesh.transform.setTranslate(SpherePosition);
        SphereMesh.transform.updateMVPMatrix();
        SphereRead = true;
        meshes.push(SphereMesh);
    })

var selectedObjIndex = -1;
var LightTranslate = 0;
let mousePos = 0;
var mouseClickX, mouseClickY;
var cameraDragY = false;
var canCameraRotate = true;

;

var SelectedObject = document.querySelector('#selected-obj');
var selObjName = document.createTextNode("");
SelectedObject.appendChild(selObjName);

var LightMode = document.querySelector('#mode-val');
var lightMode = document.createTextNode("");
LightMode.appendChild(lightMode);

var Shading = document.querySelector('#shading-val');
var shadingMode = document.createTextNode("");
Shading.appendChild(shadingMode);

// Events code
window.onload = () => 
{
    renderer.getCanvas().addEventListener("mousedown", (event) => {
        if(1)
        {
            let mouseX = event.clientX;
            let mouseY = event.clientY;

            let render_area = renderer.getCanvas().getBoundingClientRect();
            mouseX = mouseX - render_area.left;
            mouseY = mouseY - render_area.top;

            mousePos = renderer.mouseToClipCoord(mouseX, mouseY);
            
            [mouseClickX, mouseClickY] = mousePos;
            cameraDragY = true;
        }
    });
    renderer.getCanvas().addEventListener("mouseup", (event) => {
        cameraDragY = false;
    });
 
    document.addEventListener("mousemove" , (ev)=> {
        let mouseX = ev.clientX;
        let mouseY = ev.clientY;

        let render_area = renderer.getCanvas().getBoundingClientRect();
        mouseX = mouseX - render_area.left;
        mouseY = mouseY - render_area.top;

        mousePos = renderer.mouseToClipCoord(mouseX, mouseY);
        if(canCameraRotate == true)
        {
            if(cameraDragY == true)
            {
                var moveX = mousePos[0] - mouseClickX;
                var moveY = mousePos[1] - mouseClickY;

                if(moveX > 0)
                    {cameraX = moveX/(20*cameraParams.radius);}
        
                else
                    {cameraX = moveX/(20*cameraParams.radius);}
                
                if(moveY > 0)
                    {
                        cameraY = moveY/(20*cameraParams.radius);
                    }
                else
                        cameraY = moveY/(20*cameraParams.radius);}

                if(cameraX > 2*Math.PI | cameraX < -2*Math.PI)
                {
                    cameraX = 0;
                }
                
                if(cameraY > 2*Math.PI | cameraY < -2*Math.PI)
                {
                    cameraY = 0;
                }
                
                cameraParams.eye.x = cameraParams.radius * Math.sin(cameraX)*Math.cos(cameraY);
                cameraParams.eye.z = cameraParams.radius * Math.cos(cameraX)*Math.cos(cameraY);
                cameraParams.eye.y = cameraParams.radius * Math.sin(cameraY);

                if(SphereRead && TeapotRead)
                {
                    for(var mesh in meshes)
                    {
                        meshes[mesh].updateCamera(cameraParams);
                    }
                }
            }        
        
        else
        {
            if(cameraDragY == true)
            {
                //Initial Vector P1
                var p1 = vec3.create();
                vec3.normalize(p1, vec3.fromValues(mouseClickX, mouseClickY, 1000));
                // Moved Vector P2
                var p2 = vec3.create();
                vec3.normalize(p2, vec3.fromValues(mousePos[0], mousePos[1], 1000));
                
                //Rotation Angle
                var theta = vec3.angle(p1, p2);
                
                // Rotation Axis
                var rotAxis = vec3.create();
                vec3.cross(rotAxis, p1, p2);

                for(var mesh in meshes)
                {
                    if(meshes[mesh].getID() == selectedObjIndex)
                    {
                        var RotQuat = quat.create();
                        quat.setAxisAngle(RotQuat, rotAxis, theta);
                        quat.normalize(RotQuat, RotQuat);
                        var RotMat = mat4.create();
                        mat4.fromQuat(RotMat, RotQuat);

                        var CurrentRotMat = meshes[mesh].transform.getRotate();
                        mat4.multiply(CurrentRotMat, CurrentRotMat, RotMat);
                        meshes[mesh].transform.setRotate(CurrentRotMat);
                        meshes[mesh].transform.updateMVPMatrix();
                    }
                }
            }
        }    
    });


    document.addEventListener("keydown", (ev) => {

        if(ev.key == "3")
        {
            // Teapot
            selectedObjIndex = 0;
            canCameraRotate = false;
            LightTranslate = 0;
        }
        
        else if(ev.key == "4")
        {
            // Sphere
            selectedObjIndex = 2;
            canCameraRotate = false;
            LightTranslate = 0;
        }
        
        else if (ev.key == "2")
        {
            selectedObjIndex = -1;
            canCameraRotate = true;
            LightTranslate = 0;
        }

        if(ev.key == "i")
        {
            LightTranslate = LightTranslate + 1;
            LightTranslate = LightTranslate % 2;
        }
        
        if(ev.key == "0")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    meshes[mesh].lightProps.lightSwitch(0);
                }
            }
        }
        if(ev.key == "1")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    meshes[mesh].lightProps.lightSwitch(1);
                }
            }
        }

        if(ev.key == "h")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[0] -= 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "l")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[0] += 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "j")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[1] += 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "k")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[1] -= 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "a")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[2] -= 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "d")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex && LightTranslate == 1)
                {
                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[2] += 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }

        if(ev.key == "ArrowLeft")
        {   
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    var translation = meshes[mesh].transform.getTranslate();
                    translation[0] -= 1;
                    vec3.set(meshes[mesh].translation, translation[0], translation[1], translation[2]);
                    meshes[mesh].transform.setTranslate(meshes[mesh].translation);
                    meshes[mesh].transform.updateMVPMatrix();

                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[0] -= 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "ArrowRight")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    var translation = meshes[mesh].transform.getTranslate();
                    translation[0] += 1;
                    vec3.set(meshes[mesh].translation, translation[0], translation[1], translation[2]);
                    meshes[mesh].transform.setTranslate(meshes[mesh].translation);
                    meshes[mesh].transform.updateMVPMatrix();

                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[0] += 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }

        if(ev.key == "ArrowUp")
        {   
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    var translation = meshes[mesh].transform.getTranslate();
                    translation[1] += 1;
                    vec3.set(meshes[mesh].translation, translation[0], translation[1], translation[2]);
                    meshes[mesh].transform.setTranslate(meshes[mesh].translation);
                    meshes[mesh].transform.updateMVPMatrix();

                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[1] += 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        else if(ev.key == "ArrowDown")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    var translation = meshes[mesh].transform.getTranslate();
                    translation[1] -= 1;
                    vec3.set(meshes[mesh].translation, translation[0], translation[1], translation[2]);
                    meshes[mesh].transform.setTranslate(meshes[mesh].translation);
                    meshes[mesh].transform.updateMVPMatrix();

                    var lightPos = meshes[mesh].getLightPos();
                    lightPos[1] -= 1;
                    meshes[mesh].translateLight(lightPos);
                }
            }
        }
        
        if(ev.key == "+")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    var scale = meshes[mesh].transform.getScale();
                    scale[0] += .1;
                    scale[1] += .1;
                    scale[2] += .1;
                    meshes[mesh].scalingVal = scale[0];
                    meshes[mesh].transform.setScale(scale);
                    meshes[mesh].transform.updateMVPMatrix();
                }
            }
        }

        if(ev.key == "-")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    var scale = meshes[mesh].transform.getScale();
                    scale[0] = scale[0] - 0.1;
                    scale[1] = scale[1] - 0.1;
                    scale[2] = scale[2] - 0.1;
                    meshes[mesh].scalingVal = scale[0];
                    meshes[mesh].transform.setScale(scale);
                    meshes[mesh].transform.updateMVPMatrix();
                }
            }
        }

        else if(ev.key == "s")
        {
            for(var mesh in meshes)
            {
                if(meshes[mesh].getID() == selectedObjIndex)
                {
                    meshes[mesh].setShader();
                }
            }
        }
    });


};

function animate()
{
    renderer.clear();
    
    if(selectedObjIndex == 0)
    {
        selObjName.nodeValue = "Teapot";
        meshes.forEach(element => {
            if(element.getID() == 0)
            {
                shadingMode.nodeValue = (element.getShader() == 0) ? "Gourad" : "Phong";
            }
        }
        );
    }
    
    else 
    {
        selObjName.nodeValue = (selectedObjIndex == 2) ? "Sphere" : "None";
    }

    if(selectedObjIndex != -1)
    {
        lightMode.nodeValue = (LightTranslate === 0) ? "OFF" : "ON";   
    }

    if(SphereRead && TeapotRead)
    {
        var CombinedLights = [];
        meshes.forEach(element => {
            CombinedLights.push(element.lightProps.getStruct()) 
        }
        );
        
        meshes.forEach(element => {
            element.setAllLights(CombinedLights);
            
            if(element.getShader() == 0)
            {
                gouradShaderCode.use();
                element.draw(gouradShaderCode, false);
            }

            else
            {
                phongShaderCode.use();
                element.draw(phongShaderCode, false);
            }
        });
    }

    window.requestAnimationFrame(animate);
}
animate();

// Key Presses link = https://keycode.info/


