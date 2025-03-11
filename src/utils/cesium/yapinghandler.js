/**
 * Created by wqy
 * Date 2023/3/10 16:32
 * Description
 */

// import cesiumUtil from '@/modules/cesium/common/buss/CesiumViewer'
// import coordinate from '@/common/util/Coordinates'
import {GetPickedRayPositionWGS84,RemoveEntities,SetEntity,GetEntitysByContainId,GetCamera} from "@/utils/cesium/CesiumViewer"
import {GlobalState} from "../../buss/GlobalState";
import coordinate from "@/utils/cesium/Coordinates.js";

let origincustomshader={
    recorded:false,
    value:null
};
let originshadows=null;
let orignenablemodelexpre=null;

let customshader = null;
let cartesianlist = [];

let shuzhiu = new Cesium.Cartesian3();


let transformmatrix = new Cesium.Matrix3();
let transformmatrixvec1 = new Cesium.Cartesian3();
let transformmatrixvec2 = new Cesium.Cartesian3();
let transformmatrixvec3 = new Cesium.Cartesian3();

function onpreUpdate() {
    let camerasetting = GetCamera();
    let viewer = GlobalState.getInstance().viewer;
    let centerinview = new Cesium.Cartesian3();
    Cesium.Matrix4.multiplyByPoint(viewer.scene.camera.viewMatrix, cartesianlist[0][0], centerinview);
    let centerhightinview = new Cesium.Cartesian3();
    Cesium.Matrix4.multiplyByPoint(viewer.scene.camera.viewMatrix,
        coordinate.CoordinateLocal.ToCartesian(new coordinate.CoordinateLocal(0, 0, 10), cartesianlist[0][0]),
        centerhightinview
    );

    shuzhiu.x = centerhightinview.x - centerinview.x;
    shuzhiu.y = centerhightinview.y - centerinview.y;
    shuzhiu.z = centerhightinview.z - centerinview.z;

    customshader.setUniform("u_shuzhiineye", shuzhiu);
    customshader.setUniform("u_cameraheight", camerasetting.height);
    let camera = viewer.scene.camera;
    let cameraright = camera.right;
    let cameraup = camera.up;
    let fancameradir = new Cesium.Cartesian3();
    Cesium.Cartesian3.negate(camera.direction, fancameradir);
    let cartesian0 = camera.position;
    let localunitx = new coordinate.CoordinateLocal(1, 0, 0);
    let localunity = new coordinate.CoordinateLocal(0, 1, 0);
    let localunitz = new coordinate.CoordinateLocal(0, 0, 1);
    let cartesianx = coordinate.CoordinateLocal.ToCartesian(localunitx, cartesian0);
    let cartesiany = coordinate.CoordinateLocal.ToCartesian(localunity, cartesian0);
    let cartesianz = coordinate.CoordinateLocal.ToCartesian(localunitz, cartesian0);
    let bendiji1 = new Cesium.Cartesian3(cartesianx.x - cartesian0.x, cartesianx.y - cartesian0.y, cartesianx.z - cartesian0.z);
    let bendiji2 = new Cesium.Cartesian3(cartesiany.x - cartesian0.x, cartesiany.y - cartesian0.y, cartesiany.z - cartesian0.z);
    let bendiji3 = new Cesium.Cartesian3(cartesianz.x - cartesian0.x, cartesianz.y - cartesian0.y, cartesianz.z - cartesian0.z);
    let umatrix = new Cesium.Matrix3(
        bendiji1.x, bendiji2.x, bendiji3.x,
        bendiji1.y, bendiji2.y, bendiji3.y,
        bendiji1.z, bendiji2.z, bendiji3.z
    )
    let umatrixinverse = new Cesium.Matrix3();
    Cesium.Matrix3.inverse(umatrix, umatrixinverse);
    let vmatrix = new Cesium.Matrix3(
        cameraright.x, cameraup.x, fancameradir.x,
        cameraright.y, cameraup.y, fancameradir.y,
        cameraright.z, cameraup.z, fancameradir.z,
    )


    Cesium.Matrix3.multiply(umatrixinverse, vmatrix, transformmatrix);

    Cesium.Matrix3.getColumn(transformmatrix, 0, transformmatrixvec1);
    Cesium.Matrix3.getColumn(transformmatrix, 1, transformmatrixvec2);
    Cesium.Matrix3.getColumn(transformmatrix, 2, transformmatrixvec3);
    customshader.setUniform("u_transformmatrixvec1", transformmatrixvec1);
    customshader.setUniform("u_transformmatrixvec2", transformmatrixvec2);
    customshader.setUniform("u_transformmatrixvec3", transformmatrixvec3);

    for (let i = 0; i < cartesianlist.length; i++) {
        // let cartesian=new Cesium.Cartesian3();
        for(let j=0;j<cartesianlist[i].length;j++){
            let local = coordinate.CoordinateLocal.FromCartesian(cartesianlist[i][j], camera.position);
            customshader.setUniform(`u_polygonlistvec3_${i}_${j}`, new Cesium.Cartesian3(local.x, local.y, local.z));
        }
    }
}

function getPolygonUniform(polygonwgs84list) {
    let resultwgslist = polygonwgs84list.slice();





    cartesianlist.push(resultwgslist.map(item => {
        return item.ToCartesian()
    }));
    let resultuniform = {};
    for (let i = 0; i < cartesianlist.length; i++) {
        for(let j=0;j<cartesianlist[i].length;j++){
            resultuniform[`u_polygonlistvec3_${i}_${j}`] = {
                type: Cesium.UniformType.VEC3,
                value: new Cesium.Cartesian3()
            }
        }
    }
    return resultuniform;
}

export function AddFlattenInCesium(tileset, polygonwgs84list) {
    let minheight = Math.min.apply(null, polygonwgs84list.map(item => {
        return item.height;
    }));
    AddFlattenWithHeightInCesium(tileset, polygonwgs84list, minheight);
}

export function AddFlattenWithHeightInCesium(tileset, polygonwgs84list, height) {
    if (polygonwgs84list.length < 3) return false;
    let uniforms = getPolygonUniform(polygonwgs84list);

    //压平值
    uniforms.u_height = {
        type: Cesium.UniformType.FLOAT,
        value: height
    };
    uniforms.u_shuzhiineye = {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3()
    };
    uniforms.u_cameraheight = {
        type: Cesium.UniformType.FLOAT,
        value: 0
    };

    uniforms.u_transformmatrixvec1= {
        type: Cesium.UniformType.VEC3,
            value: new Cesium.Cartesian3()
    };
    uniforms.u_transformmatrixvec2= {
        type: Cesium.UniformType.VEC3,
            value: new Cesium.Cartesian3()
    };
    uniforms. u_transformmatrixvec3= {
        type: Cesium.UniformType.VEC3,
            value: new Cesium.Cartesian3()
    };



    customshader = new Cesium.CustomShader({
        uniforms: uniforms,
        vertexShaderText: `
            
                bool onsegment(vec2 p1,vec2 p2,vec2 p){
                    if((p.x-p1.x)*(p2.y-p1.y)==(p2.x-p1.x)*(p.y-p1.y)&&min(p1.x,p2.x)<=p.x&&p.x<=max(p1.x,p2.x)&&min(p1.y,p2.y)<=p.y&&p.y<=max(p1.y,p2.y)){
                         return true;
                     }
                    else{
                        return false;
                    }
                }

				 void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
				
                 vec4 viewpos = (czm_modelView * vec4(vsInput.attributes.positionMC, 1.0));
                 vec3 viewposvec3=viewpos.xyz/viewpos.w;
                
                   
                  vec3 viewposlocalvec3=vec3(0.0);
                  viewposlocalvec3.z=u_transformmatrixvec1.z*viewposvec3.x+u_transformmatrixvec2.z*viewposvec3.y+u_transformmatrixvec3.z*viewposvec3.z;
                  viewposlocalvec3.y=u_transformmatrixvec1.y*viewposvec3.x+u_transformmatrixvec2.y*viewposvec3.y+u_transformmatrixvec3.y*viewposvec3.z;
                  viewposlocalvec3.x=u_transformmatrixvec1.x*viewposvec3.x+u_transformmatrixvec2.x*viewposvec3.y+u_transformmatrixvec3.x*viewposvec3.z;
           
                 
                 vec2 zerovec2=vec2(0.0);
                 bool isinpolygon=false;
                 ${function () {
                     let result=``;
                     for(let i=0;i<cartesianlist.length;i++){
                         result+=`
                        bool isinpolygon${i}=false;                         
                        float count${i}=0.0;                       
                         `;
                         for(let j=1;j<=cartesianlist[i].length;j++){
                             result +=
                                 `vec3 line_${i}_${j}=u_polygonlistvec3_${i}_${j % cartesianlist[i].length}-u_polygonlistvec3_${i}_${j - 1};
                             vec3 viewP_${i}_${j}=viewposlocalvec3-u_polygonlistvec3_${i}_${j - 1};
                             if(onsegment(zerovec2,line_${i}_${j}.xy,viewP_${i}_${j}.xy)==false){                                
                                 if(viewP_${i}_${j}.y>min(0.0,line_${i}_${j}.y))
                                     if(viewP_${i}_${j}.y<=max(0.0,line_${i}_${j}.y))
                                         if(viewP_${i}_${j}.x<=max(0.0,line_${i}_${j}.x))
                                             if(0.0!=line_${i}_${j}.y)
                                             {
                                                 float xinters_${i}_${j}=(viewP_${i}_${j}.y-zerovec2.y)*(line_${i}_${j}.x-zerovec2.x)/(line_${i}_${j}.y-zerovec2.y)+zerovec2.x;
                                                 if(zerovec2.x==line_${i}_${j}.x||viewP_${i}_${j}.x<=xinters_${i}_${j}){
                                                     count${i}+=1.0;
                                                 }
                                             }
                             }
                             else{
                                 isinpolygon${i}=true;
                             }
                         `;
                         }
                         result+=`
                         isinpolygon${i}=(isinpolygon${i}==true||mod(count${i},2.0)>0.0001);
                         isinpolygon=isinpolygon|| isinpolygon${i};
                         `
                     }
                     
                     return result;
                     
        }()}
                
                 if(isinpolygon){    
                            
                      float lashenheight=u_height-(u_cameraheight+viewposlocalvec3.z);
                     
                      if(lashenheight<0.)
                      {

                      viewposvec3+=normalize(u_shuzhiineye)*lashenheight*1.05;                      
                      viewpos=vec4(viewposvec3,1.0);
                      vec4 modelpos = czm_inverseModelView * viewpos;
                      vsOutput.positionMC=modelpos.xyz/modelpos.w;
                      }
                  }
                  
        }`,


        fragmentShaderText: `
        
                    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                   

            }`
    })

    if(origincustomshader.recorded===false)
    {
        origincustomshader.value=tileset.customShader;
        origincustomshader.recorded=true;
    }

    tileset.customShader = customshader;
    if(originshadows==null){
        originshadows=tileset.shadows;
    }
    tileset.shadows = Cesium.ShadowMode.DISABLED;

    if(orignenablemodelexpre==null)
    {
        orignenablemodelexpre=tileset.enableModelExperimental;
    }
    tileset.enableModelExperimental = true;


    let viewer = GlobalState.getInstance().viewer;
    viewer.scene.preUpdate.removeEventListener(onpreUpdate);
    viewer.scene.preUpdate.addEventListener(onpreUpdate);



}

const intersectpolygon={
    intersect:1,
    totallyout:3,
    contain:4
}

const zerocartesian2=new Cesium.Cartesian2();
function intersecpol(tile) {



return intersectpolygon.intersect;


}


const scratchXAxis = new Cesium.Cartesian3();
const scratchYAxis = new Cesium.Cartesian3();
const scratchZAxis = new Cesium.Cartesian3();
function modifyboundingvolumn(tile) {

    if(tile.updatedbounding===true) return;
    let center=tile.boundingVolume.boundingVolume.center;
    let newcenter=coordinate.CoordinateLocal.ToCartesian(new coordinate.CoordinateLocal(0,0,60),center);
    tile.boundingVolume.boundingVolume.center.x=newcenter.x;
    tile.boundingVolume.boundingVolume.center.y=newcenter.y;
    tile.boundingVolume.boundingVolume.center.z=newcenter.z;
    tile.updatedbounding=true;
    tile.boundingVolume.boundingVolume.halfAxes[6]*=100;
    tile.boundingVolume.boundingVolume.halfAxes[7]*=100;
    tile.boundingVolume.boundingVolume.halfAxes[8]*=100;
    tile.updateTransform();

}



function updatetilebounding(tile) {
    let intersecpoly=intersecpol(tile);
    if(intersecpoly==intersectpolygon.contain||intersectpolygon.intersect){
        modifyboundingvolumn(tile);
        if(tile.children&&tile.children.length>0){
            tile.children.forEach(child=>{
                updatetilebounding(child)
            })
        }
    }
}

export function UpdateFlattenHeightInCesium(newheight) {
    if (customshader == null) return;
    customshader.setUniform("u_height", newheight)
}

export function ClearFlattenInCesium(tileset) {
    let viewer = GlobalState.getInstance().viewer;
    viewer.scene.preUpdate.removeEventListener(onpreUpdate);
    if(origincustomshader.recorded==true){
    // if(origincustomshader.recorded==true&&originshadows!=null&&orignenablemodelexpre!=null){
        tileset.enableModelExperimental = orignenablemodelexpre;
        tileset.customShader = origincustomshader.value;
        tileset.shadows = originshadows;
    }
    customshader = undefined;
    cartesianlist = [];
}

