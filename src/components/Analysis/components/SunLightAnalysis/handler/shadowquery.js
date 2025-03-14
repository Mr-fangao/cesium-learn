/**
 * Created by wqy
 * Date 2022/7/1 19:21
 * Description
 */
import coordinates from '@/utils/cesium/Coordinates.js';
import * as turf from "@turf/turf";
import Bus from '@/buss/eventBus.js';

let primitivepoints = null;
let poststage = null;
function ShadowQuery(viewer) {
    this.viewer = viewer;
    this._starttime = null;
    this._endtime = null;
    this._bottomheight = null;
    this._extrudeheight = null;
    this._dianjianju = null;
    this._poilist = null;
}

ShadowQuery.prototype.SetPoilist = function (poilist) {
    this._poilist = poilist;
    update(this);
}
ShadowQuery.prototype.GetShadowInfo = function (windowpos) {

}
ShadowQuery.prototype.Update = function (options) {
    this.startTime = options.startTime || this.startTime;
    this.endTime = options.endTime || this.endTime;
    this.bottomheight = options.bottomheight!=null?options.bottomheight:this.bottomheight;
    this.extrudeheight = options.extrudeheight!=null?options.extrudeheight:this.extrudeheight;
    this.spacing = options.spacing || this.spacing;
    this._poilist = options.poilist || this._poilist;
    update(this);
}
ShadowQuery.prototype.clear = function () {
    if (primitivepoints) {
        this.viewer.scene.primitives.remove(primitivepoints);
    }
    if(poststage){
        this.viewer.scene.postProcessStages.remove(poststage);
        poststage = null;
    }
}

Object.defineProperties(ShadowQuery.prototype, {
    startTime: {
        get() {
            return this._starttime;
        },
        set(value) {
            this._starttime = value;
            update(this);
        }
    },
    endTime: {
        get() {
            return this._endtime;
        },
        set(value) {
            this._endtime = value;
            update(this);
        }
    },
    bottomheight: {
        get() {
            return this._bottomheight;
        },
        set(value) {
            this._bottomheight = value;
            update(this);
        }
    },
    extrudeheight: {
        get() {
            return this._extrudeheight;
        },
        set(value) {
            this._extrudeheight = value;
            update(this);
        }
    },
    spacing: {
        get() {
            return this._dianjianju;
        },
        set(value) {
            this._dianjianju = value;
            update(this);
        }
    }
})

ShadowQuery.prototype.destroy = function () {
    this.clear();
    this.viewer = null;
    this._starttime = null;
    this._endtime = null;
    this._bottomheight = null;
    this._extrudeheight = null;
    this._dianjianju = null;
    this._poilist = null;
}

function update(shadowquery) {
    shadowquery.clear();
    //按照属性绘制所有点
    if (shadowquery._poilist == null || shadowquery._bottomheight == null || shadowquery._extrudeheight == null || shadowquery._dianjianju == null || shadowquery.viewer == null || shadowquery.startTime == null || shadowquery.endTime == null) return;
    drawpois(shadowquery);
}

/**
 * 绘制所有采光点
 */
function drawpois(shadowquery) {
    let lonlist = shadowquery._poilist.map(item => {
        return item.longitude;
    });
    let latlist = shadowquery._poilist.map(item => {
        return item.latitude;
    });
    let minlon = Math.min(...lonlist);
    let maxlon = Math.max(...lonlist);
    let minlat = Math.min(...latlist);
    let maxlat = Math.max(...latlist);

    let turfcoordinates = shadowquery._poilist.map(item => {
        return [item.longitude, item.latitude];
    });
    turfcoordinates.push(turfcoordinates[0]);
    let poly = turf.polygon([turfcoordinates]);
    let minpoi = new coordinates.CoordinateWGS84(minlon, minlat, 0);
    let maxpoi = new coordinates.CoordinateWGS84(maxlon, maxlat, 0);
    // let minpoilocal=new coordinates.CoordinateLocal(0,0,0);
    let minpoicartesian = minpoi.ToCartesian();
    let maxpoicartesian = maxpoi.ToCartesian();
    let maxpoilocal = coordinates.CoordinateLocal.FromCartesian(maxpoicartesian, minpoicartesian);
    let pois = [];
    for (let curlocaly = 0; curlocaly < maxpoilocal.y; curlocaly += shadowquery._dianjianju) {
        for (let curlocalx = 0; curlocalx < maxpoilocal.x; curlocalx += shadowquery._dianjianju) {
            let poilocal = new coordinates.CoordinateLocal(curlocalx, curlocaly, 0);
            let poicartesian = coordinates.CoordinateLocal.ToCartesian(poilocal, minpoicartesian);
            let poiwgs84 = coordinates.CoordinateWGS84.fromCatesian(poicartesian);

            let pt = turf.point([poiwgs84.longitude, poiwgs84.latitude]);
            let inpolygon = turf.booleanPointInPolygon(pt, poly);
            if (inpolygon === true) {
                pois.push({
                    wgs84poi: poiwgs84,
                    localpoi:poilocal
                    // cartesianpoi: poicartesian
                })
            }
        }
    }

    let heights = [shadowquery._bottomheight];
    while ((heights[heights.length - 1] + shadowquery._dianjianju) < (shadowquery._bottomheight + shadowquery._extrudeheight)) {
        heights.push(heights[heights.length - 1] + shadowquery._dianjianju);
    }
    //顶点数组
    let arr=[];
    pois.forEach(item => {
        heights.forEach(heightitem => {
            arr.push(item.localpoi.x);
            arr.push(item.localpoi.y);
            arr.push(heightitem)
        })
    })
    //模型矩阵
    var position =minpoicartesian;
    var heading = Cesium.Math.toRadians(0)
    var pitch = Cesium.Math.toRadians(0)
    var roll = Cesium.Math.toRadians(0)
    var headingPitchRoll = new Cesium.HeadingPitchRoll(heading, pitch, roll)

    var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, headingPitchRoll, Cesium.Ellipsoid.WGS84, Cesium.Transforms.eastNorthUpToFixedFrame, new Cesium.Matrix4())

    var temp = new Multipoint({ viewer:shadowquery.viewer, modelMatrix:modelMatrix, arr:arr,uniforms:createuniforms(shadowquery) })
    primitivepoints = shadowquery.viewer.scene.primitives.add(temp);

    // Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click,function (e) {
    //     var feature = shadowquery.viewer.scene.pick(e.position);
    // });
}

let transformMatrix = new Cesium.Matrix3();
const sunCartographicScratch = new Cesium.Cartographic();
function setSunAndMoonDirections(result, time,mapProjection,viewrotate3d) {
    // if ( !Cesium.defined(Cesium.Transforms.computeIcrfToFixedMatrix(time, transformMatrix)) ) {
    //     transformMatrix = Transforms.computeTemeToPseudoFixedMatrix(time,transformMatrix);
    // }
    if ( Cesium.defined(Cesium.Transforms.computeIcrfToFixedMatrix(time, transformMatrix)) ) {
        transformMatrix = Cesium.Transforms.computeTemeToPseudoFixedMatrix(time,transformMatrix);
    }
    let position = Cesium.Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(
        time,
        result._sunPositionWC
    );
    Cesium.Matrix3.multiplyByVector(transformMatrix, position, position);

    Cesium.Cartesian3.normalize(position, result._sunDirectionWC);

    position = Cesium.Matrix3.multiplyByVector(
        viewrotate3d,
        position,
        result._sunDirectionEC
    );
    Cesium.Cartesian3.normalize(position, position);

    const projection = mapProjection;
    const ellipsoid = projection.ellipsoid;
    const sunCartographic = ellipsoid.cartesianToCartographic(
        result._sunPositionWC,
        sunCartographicScratch
    );
    projection.project(sunCartographic, result._sunPositionColumbusView);
}
function insertShadowCastCommands(scene, commandList, shadowMap) {
    const shadowVolume = shadowMap.shadowMapCullingVolume;
    const isPointLight = shadowMap.isPointLight;
    const passes = shadowMap.passes;
    const numberOfPasses = passes.length;

    const length = commandList.length;
    for (let i = 0; i < length; ++i) {
        const command = commandList[i];
        scene.updateDerivedCommands(command);

        if (
            command.castShadows &&
            (command.pass ===Cesium.Pass.GLOBE ||
                command.pass === Cesium.Pass.CESIUM_3D_TILE ||
                command.pass === Cesium.Pass.OPAQUE ||
                command.pass === Cesium.Pass.TRANSLUCENT)
        ) {
            if (scene.isVisible(command, shadowVolume)) {
                if (isPointLight) {
                    for (let k = 0; k < numberOfPasses; ++k) {
                        passes[k].commandList.push(command);
                    }
                } else if (numberOfPasses === 1) {
                    passes[0].commandList.push(command);
                } else {
                    let wasVisible = false;
                    // Loop over cascades from largest to smallest
                    for (let j = numberOfPasses - 1; j >= 0; --j) {
                        const cascadeVolume = passes[j].cullingVolume;
                        if (scene.isVisible(command, cascadeVolume)) {
                            passes[j].commandList.push(command);
                            wasVisible = true;
                        } else if (wasVisible) {
                            // If it was visible in the previous cascade but now isn't
                            // then there is no need to check any more cascades
                            break;
                        }
                    }
                }
            }
        }
    }
}
function executeShadowMapCastCommands(scene) {
    const frameState = scene.frameState;
    const shadowMaps = frameState.shadowState.shadowMaps;
    const shadowMapLength = shadowMaps.length;

    if (!frameState.shadowState.shadowsEnabled) {
        return;
    }

    const context = scene.context;
    const uniformState = context.uniformState;

    for (let i = 0; i < shadowMapLength; ++i) {
        const shadowMap = shadowMaps[i];
        if (shadowMap.outOfView) {
            continue;
        }

        // Reset the command lists
        const passes = shadowMap.passes;
        const numberOfPasses = passes.length;
        for (let j = 0; j < numberOfPasses; ++j) {
            passes[j].commandList.length = 0;
        }

        // Insert the primitive/model commands into the command lists
        const sceneCommands = scene.frameState.commandList;
        insertShadowCastCommands(scene, sceneCommands, shadowMap);

        for (let j = 0; j < numberOfPasses; ++j) {
            const pass = shadowMap.passes[j];
            uniformState.updateCamera(pass.camera);
            shadowMap.updatePass(context, j);
            const numberOfCommands = pass.commandList.length;
            for (let k = 0; k < numberOfCommands; ++k) {
                const command = pass.commandList[k];
                // Set the correct pass before rendering into the shadow map because some shaders
                // conditionally render based on whether the pass is translucent or opaque.
                uniformState.updatePass(command.pass);
                executeCommand(
                    command.derivedCommands.shadows.castCommands[i],
                    scene,
                    context,
                    pass.passState
                );
            }
        }
    }
}

function executeCommand(command, scene, context, passState, debugFramebuffer) {
    const frameState = scene._frameState;
    if (Cesium.defined(scene.debugCommandFilter) && !scene.debugCommandFilter(command)) {
        return;
    }
    if (command instanceof Cesium.ClearCommand) {
        command.execute(context, passState);
        return;
    }
    if (command.debugShowBoundingVolume && Cesium.defined(command.boundingVolume)) {
        debugShowBoundingVolume(command, scene, passState, debugFramebuffer);
    }
    if (frameState.useLogDepth && Cesium.defined(command.derivedCommands.logDepth)) {
        command = command.derivedCommands.logDepth.command;
    }
    const passes = frameState.passes;
    if (
        !passes.pick &&
        !passes.depth &&
        scene._hdr &&
        Cesium.defined(command.derivedCommands) &&
        Cesium.defined(command.derivedCommands.hdr)
    ) {
        command = command.derivedCommands.hdr.command;
    }
    if (passes.pick || passes.depth) {
        if (
            passes.pick &&
            !passes.depth &&
            Cesium.defined(command.derivedCommands.picking)
        ) {
            command = command.derivedCommands.picking.pickCommand;
            command.execute(context, passState);
            return;
        } else if (Cesium.defined(command.derivedCommands.depth)) {
            command = command.derivedCommands.depth.depthOnlyCommand;
            command.execute(context, passState);
            return;
        }
    }
    if (scene.debugShowCommands || scene.debugShowFrustums) {
        scene._debugInspector.executeDebugShowFrustumsCommand(
            scene,
            command,
            passState
        );
        return;
    }
    if (
        frameState.shadowState.lightShadowsEnabled &&
        command.receiveShadows &&
        Cesium.defined(command.derivedCommands.shadows)
    ) {
        // If the command receives shadows, execute the derived shadows command.
        // Some commands, such as OIT derived commands, do not have derived shadow commands themselves
        // and instead shadowing is built-in. In this case execute the command regularly below.
        command.derivedCommands.shadows.receiveCommand.execute(context, passState);
    } else {
        command.execute(context, passState);
    }
}

function createuniforms(shadowquery) {
    let jsstarttime = Cesium.JulianDate.toDate(shadowquery.startTime);
    let jsendtime = Cesium.JulianDate.toDate(shadowquery.endTime);
    let jsstarttimemilsec = jsstarttime.getTime();
    let totalspanmilsecs = jsendtime.getTime() - jsstarttimemilsec;
    let jiange = totalspanmilsecs / 4;

    let juliantimelist = [
        shadowquery.startTime,
        Cesium.JulianDate.fromDate(new Date(jsstarttimemilsec + jiange)),
        Cesium.JulianDate.fromDate(new Date(jsstarttimemilsec + jiange * 2)),
        shadowquery.endTime
    ];

    let uniforms = {
        shadowMap_textureCube: [],
        shadowMap_matrix: [],
        shadowMap_lightPositionEC: [],
        shadowMap_lightDirectionEC:[],
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: [],
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: [],
        camera_projection_matrix: [],
        camera_view_matrix: [],
        shadowMap_cascadeSplitsCur:[],
        shadowMap_cascadeMatricesCur:[],
    };
    let shadowmaporigin = shadowquery.viewer.scene.shadowMap;
    let shadowmap,lightcamera;

    for (let i = 0; i < 4; i++) {
        shadowquery.viewer.clock.currentTime = juliantimelist[i];
        // if(shadowmap!=null){
        //     shadowmap.destroy();
        // }


        // lightcamera=new Cesium.Camera(shadowquery.viewer.scene);
        // lightcamera.position = Cesium.Cartesian3.clone(shadowquery.viewer.scene.shadowMap._lightCamera.position);
        //
        // lightcamera.frustum.near = shadowquery.viewer.scene.shadowMap._lightCamera.frustum.near;
        // lightcamera.frustum.far = shadowquery.viewer.scene.shadowMap._lightCamera.frustum.far;
        //
        // lightcamera.frustum.aspectRatio = shadowquery.viewer.scene.shadowMap._lightCamera.frustum.aspectRatio;
        // lightcamera.frustum.fov =shadowquery.viewer.scene.shadowMap._lightCamera.frustum.fov;
        // lightcamera.direction=shadowquery.viewer.scene.shadowMap._lightCamera.direction;
        // lightcamera.right=shadowquery.viewer.scene.shadowMap._lightCamera.right;
        // lightcamera.up=shadowquery.viewer.scene.shadowMap._lightCamera.up;
        //
        // shadowmap=new Cesium.ShadowMap({
        //     context: (shadowquery.viewer.scene).context,
        //     lightCamera: lightcamera,
        //     enabled: shadowquery.viewer.scene.shadowMap.enabled,
        //     softShadows: shadowquery.viewer.scene.shadowMap.softShadows,
        //     normalOffset: shadowquery.viewer.scene.shadowMap.normalOffset,
        //     fromLightSource: shadowquery.viewer.scene.shadowMap.fromLightSource,
        //     darkness:shadowquery.viewer.scene.shadowMap.darkness,
        //     fadingEnabled:shadowquery.viewer.scene.shadowMap.fadingEnabled,
        //     maximumDistance:shadowquery.viewer.scene.shadowMap.maximumDistance,
        //     isPointLight: shadowquery.viewer.scene.shadowMap.isPointLight,
        //     pointLightRadius: shadowquery.viewer.scene.shadowMap.pointLightRadius,
        //     cascadesEnabled: shadowquery.viewer.scene.shadowMap.cascadesEnabled,
        //     size: shadowquery.viewer.scene.shadowMap.size,
        // });
        // shadowmap=shadowquery.viewer.scene.shadowMap;
        let sunsetting={
            _sunPositionWC:new Cesium.Cartesian3(),
            _sunDirectionWC:new Cesium.Cartesian3(),
            _sunDirectionEC:new Cesium.Cartesian3(),
            _sunPositionColumbusView:new Cesium.Cartesian3()
        };
        setSunAndMoonDirections(sunsetting,juliantimelist[i], shadowquery.viewer.scene._frameState.mapProjection,shadowquery.viewer.scene.context.uniformState.viewRotation3D);

        Cesium.Cartesian3.negate(sunsetting._sunDirectionWC, shadowquery.viewer.scene.shadowMap._lightCamera.direction);
        // Cesium.Cartesian3.negate(sunsetting._sunDirectionWC, lightcamera.direction);
        // shadowmap=new Cesium.ShadowMap({
        //     context: (shadowquery.viewer.scene).context,
        //     lightCamera: lightcamera,
        // })
        shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        // executeShadowMapCastCommands(shadowquery.viewer.scene);
        // shadowmap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        uniforms.shadowMap_textureCube.push(Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture"));
        // uniforms.shadowMap_textureCube.push(Reflect.get(shadowquery.viewer.scene.shadowMap, "_colorAttachment"));
        // uniforms.shadowMap_textureCube.push(Cesium.Texture.fromFramebuffer({
        //     context : shadowquery.viewer.scene.context,
        //     framebuffer:shadowquery.viewer.scene.shadowMap._passes[0].framebuffer
        // }));
        uniforms.shadowMap_matrix.push(Cesium.Matrix4.clone(Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapMatrix")));

        uniforms.shadowMap_lightPositionEC.push(Cesium.Cartesian4.clone(Reflect.get(shadowquery.viewer.scene.shadowMap, "_lightPositionEC")));
        uniforms.shadowMap_lightDirectionEC.push(Cesium.Cartesian3.clone(Reflect.get(shadowquery.viewer.scene.shadowMap, "_lightDirectionEC")));
        let bias = shadowquery.viewer.scene.shadowMap._pointBias;
        uniforms.shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.push(Cesium.Cartesian4.fromElements(
            bias.normalOffsetScale,
            shadowquery.viewer.scene.shadowMap._distance,
            shadowquery.viewer.scene.shadowMap.maximumDistance,
            // 0.0,
            shadowquery.viewer.scene._darkness,
            new Cesium.Cartesian4()
        ));
        let scratchTexelStepSize = new Cesium.Cartesian2();
        let texelStepSize = scratchTexelStepSize;
        texelStepSize.x = 1.0 / shadowquery.viewer.scene.shadowMap._textureSize.x;
        texelStepSize.y = 1.0 / shadowquery.viewer.scene.shadowMap._textureSize.y;
        uniforms.shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.push(Cesium.Cartesian4.fromElements(
            texelStepSize.x,
            texelStepSize.y,
            bias.depthBias,
            bias.normalShadingSmooth,
            new Cesium.Cartesian4()
        ));

        let cascadesplits=Reflect.get(shadowquery.viewer.scene.shadowMap, "_cascadeSplits");
        uniforms.shadowMap_cascadeSplitsCur.push(cascadesplits[0]);
        uniforms.shadowMap_cascadeSplitsCur.push(cascadesplits[1]);
        uniforms.camera_projection_matrix.push(shadowquery.viewer.scene.shadowMap._lightCamera.frustum.projectionMatrix);
        uniforms.camera_view_matrix.push(shadowquery.viewer.scene.shadowMap._lightCamera.viewMatrix);
        let shadowMap_cascadeMatrices=Reflect.get(shadowquery.viewer.scene.shadowMap, "_cascadeMatrices");
        uniforms.shadowMap_cascadeMatricesCur.push(shadowMap_cascadeMatrices[0]);
        uniforms.shadowMap_cascadeMatricesCur.push(shadowMap_cascadeMatrices[1]);
        uniforms.shadowMap_cascadeMatricesCur.push(shadowMap_cascadeMatrices[2]);
        uniforms.shadowMap_cascadeMatricesCur.push(shadowMap_cascadeMatrices[3]);
    }

    shadowquery.viewer.clock.currentTime =Cesium.JulianDate.fromDate(new Date());
    return {
        shadowMap_textureCube(){
            // let result=[];
            // for (let i = 0; i < 4; i++) {
            //     shadowquery.viewer.clock.currentTime = juliantimelist[i];
            //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
            //     result.push(Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture"));
            // }
            // return result;
           return uniforms.shadowMap_textureCube;
        },
        // shadowMap_textureCube1(){
        //     shadowquery.viewer.clock.currentTime = juliantimelist[0];
        //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        //     let result=shadowquery.viewer.scene.shadowMap._shadowMapTexture;
        //     // let result=Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture");
        //     return result;
        // },
        // shadowMap_textureCube2(){
        //     shadowquery.viewer.clock.currentTime = juliantimelist[1];
        //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        //     let result=Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture");
        //     return result;
        // },
        // shadowMap_textureCube3(){
        //     shadowquery.viewer.clock.currentTime = juliantimelist[2];
        //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        //     let result=Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture");
        //     return result;
        // },
        // shadowMap_textureCube4(){
        //     shadowquery.viewer.clock.currentTime = juliantimelist[3];
        //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        //     let result=Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture");
        //     return result;
        // },
        // shadowMap_matrix(){
        //     return uniforms.shadowMap_matrix;
        // },
        // shadowMap_lightPositionEC(){
        //     return uniforms.shadowMap_lightPositionEC;
        // },
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness(){
            return uniforms.shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness;
        },
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth(){
            return uniforms.shadowMap_texelSizeDepthBiasAndNormalShadingSmooth;
        },
        shadowMap_cascadeSplitsCur(){
            return uniforms.shadowMap_cascadeSplitsCur;
        },
        shadowMap_lightDirectionEC(){
            return uniforms.shadowMap_lightDirectionEC;
        },
        // shadowMap_lightDirectionEC1(){
        //     shadowquery.viewer.clock.currentTime = juliantimelist[0];
        //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        //     let result=shadowquery.viewer.scene.shadowMap._lightDirectionEC;
        //     return result;
        // },
        // shadowMap_lightDirectionEC2(){
        //     shadowquery.viewer.clock.currentTime = juliantimelist[1];
        //     shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        //     let result=shadowquery.viewer.scene.shadowMap._lightDirectionEC;
        //     return result;
        // },
        shadowMap_cascadeMatricesCur(){
            return uniforms.shadowMap_cascadeMatricesCur;
        },
        // camera_view_matrix(){
        //     return uniforms.camera_view_matrix;
        // }
    };
}
//#region
const fs = ` 
 #define USE_CUBE_MAP_SHADOW true
 uniform sampler2D colorTexture;
 uniform sampler2D depthTexture;
 varying vec2 v_textureCoordinates;
 uniform mat4 camera_projection_matrix[4];
 uniform mat4 camera_view_matrix[4];
 uniform samplerCube shadowMap_textureCube[4];
 uniform mat4 shadowMap_matrix[4];
 uniform vec4 shadowMap_lightPositionEC[4];
 uniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[4];
 uniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[4];
 struct zx_shadowParameters
 {
     vec3 texCoords;
     float depthBias;
     float depth;
     float nDotL;
     vec2 texelStepSize;
     float normalShadingSmooth;
     float darkness;
 };
 float czm_shadowVisibility(samplerCube shadowMap, zx_shadowParameters shadowParameters)
 {
     float depthBias = shadowParameters.depthBias;
     float depth = shadowParameters.depth;
     float nDotL = shadowParameters.nDotL;
     float normalShadingSmooth = shadowParameters.normalShadingSmooth;
     float darkness = shadowParameters.darkness;
     vec3 uvw = shadowParameters.texCoords;
     depth -= depthBias;
     float visibility = czm_shadowDepthCompare(shadowMap, uvw, depth);
     return czm_private_shadowVisibility(visibility, nDotL, normalShadingSmooth, darkness);
 }
 vec4 getPositionEC(){
     return czm_windowToEyeCoordinates(gl_FragCoord);
 }
 vec3 getNormalEC(){
     return vec3(1.);
 }
 vec4 toEye(in vec2 uv,in float depth){
     vec2 xy=vec2((uv.x*2.-1.),(uv.y*2.-1.));
     vec4 posInCamera=czm_inverseProjection*vec4(xy,depth,1.);
     posInCamera=posInCamera/posInCamera.w;
     return posInCamera;
 }
 vec3 pointProjectOnPlane(in vec3 planeNormal,in vec3 planeOrigin,in vec3 point){
     vec3 v01=point-planeOrigin;
     float d=dot(planeNormal,v01);
     return(point-planeNormal*d);
 }
 float getDepth(in vec4 depth){
     float z_window=czm_unpackDepth(depth);
     z_window=czm_reverseLogDepth(z_window);
     float n_range=czm_depthRange.near;
     float f_range=czm_depthRange.far;
     return(2.*z_window-n_range-f_range)/(f_range-n_range);
 }
 float shadow(vec4 tsdbnss,vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness,vec4 shadowMap_lightPositionEC,samplerCube shadowMap_textureCube,in vec4 positionEC)
 {
 // return 2.0;
     vec3 normalEC=getNormalEC();
     zx_shadowParameters shadowParameters;
     shadowParameters.texelStepSize=tsdbnss.xy;
     shadowParameters.depthBias=tsdbnss.z;
     shadowParameters.normalShadingSmooth=tsdbnss.w;
     shadowParameters.darkness=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.w;
     vec3 directionEC=positionEC.xyz-shadowMap_lightPositionEC.xyz;
     float distance=length(directionEC);
     directionEC=normalize(directionEC);
     float radius=shadowMap_lightPositionEC.w;
     if(distance>radius)
     {
         return 2.0;
     }
     vec3 directionWC=czm_inverseViewRotation*directionEC;
     shadowParameters.depth=distance/radius-0.05;
      // shadowParameters.depth=distance/radius-0.0003;
     shadowParameters.nDotL=clamp(dot(normalEC,-directionEC),0.,1.);
     shadowParameters.texCoords=directionWC;
     float visibility=czm_shadowVisibility(shadowMap_textureCube,shadowParameters);
     return visibility;
 }
 bool visible(in vec4 result)
 {
     result.x/=result.w;
     result.y/=result.w;
     result.z/=result.w;
     return result.x>=-1.&&result.x<=1.
     &&result.y>=-1.&&result.y<=1.
     &&result.z>=-1.&&result.z<=1.;
 }
 void main(){
     // 釉色 = 结构二维(颜色纹理, 纹理坐标)
     gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
     // 深度 = 获取深度(结构二维(深度纹理, 纹理坐标))
     float depth = getDepth(texture2D(depthTexture, v_textureCoordinates));
     // 视角 = (纹理坐标, 深度)
     vec4 viewPos = toEye(v_textureCoordinates, depth);
     // 世界坐标
     vec4 wordPos = czm_inverseView * viewPos;
     float flag=0.0;
     for(int i=0;i<4;i++)
     {
      // 虚拟相机中坐标
     vec4 vcPos = camera_view_matrix[i] * wordPos;
      // 透视投影
       vec4 posInEye = camera_projection_matrix[i] * vcPos;
        if(visible(posInEye)){
             float vis = shadow(shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[i],shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[i],shadowMap_lightPositionEC[i],shadowMap_textureCube[i],viewPos);
             if(vis > 0.3){
             flag+=0.25;
                 // gl_FragColor = mix(gl_FragColor,helsing_visibleAreaColor,.5);
             } 
         }
     }
     
     if(flag<0.25){
     //gl_FragColor=vec4(0.0,0.0,1.0,1.0);
     }
     else if(flag<0.5)
     {
     gl_FragColor=vec4(0.0,1.0,0.0,1.0);
     }
      else if(flag<0.5)
     {
     gl_FragColor=vec4(0.0,1.0,0.0,1.0);
     }
     else if(flag<0.75)
     {
     gl_FragColor=vec4(1.0,1.0,0.0,1.0);
     }
     else if(flag<1.0)
     {
     gl_FragColor=vec4(1.0,0.5,0.0,1.0);
     }
     else if(flag<1.1){
     gl_FragColor=vec4(1.0,0.0,0.0,1.0);
     }
     
 }`;

//#endregion

/**
 * 作用是根据日照情况渲染每个点的颜色
 * @param shadowquery
 */
function addpostprocess(shadowquery) {
    createPostStage(shadowquery);

}


const timespan = 60000;//时间间隔 1分钟
function createPostStage(shadowquery) {
    let jsstarttime = Cesium.JulianDate.toDate(shadowquery.startTime);
    let jsendtime = Cesium.JulianDate.toDate(shadowquery.endTime);
    let totalspanmilsecs = jsendtime.getTime() - jsstarttime.getTime();
    let jiange = totalspanmilsecs / 4;

    let juliantimelist = [
        shadowquery.startTime,
        Cesium.JulianDate.fromDate(new Date(jsstarttime + jiange)),
        Cesium.JulianDate.fromDate(new Date(jsstarttime + jiange * 2)),
        shadowquery.endTime
    ];
    // let i=timespan;
    // for(;i<totalspanmilsecs;i+=timespan){
    //     juliantimelist.push(Cesium.JulianDate.fromDate(new Date(jsstarttime+i)))
    // }
    // if(i<jsendtime){
    //     juliantimelist.push(shadowquery.endTime);
    // }

    let uniforms = {
        shadowMap_textureCube: [],
        shadowMap_matrix: [],
        shadowMap_lightPositionEC: [],
        shadowMap_lightDirectionEC:[],
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: [],
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: [],
        camera_projection_matrix: [],
        camera_view_matrix: []
    };
    for (let i = 0; i < 4; i++) {
        shadowquery.viewer.clock.currentTime = juliantimelist[i];
        shadowquery.viewer.scene.shadowMap.update(Reflect.get(shadowquery.viewer.scene, "_frameState"));
        uniforms.shadowMap_textureCube.push(Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapTexture"));
        uniforms.shadowMap_matrix.push(Reflect.get(shadowquery.viewer.scene.shadowMap, "_shadowMapMatrix"));

        uniforms.shadowMap_lightPositionEC.push(Reflect.get(shadowquery.viewer.scene.shadowMap, "_lightPositionEC"));
        uniforms.shadowMap_lightDirectionEC.push(Cesium.Cartesian3.clone(Reflect.get(shadowquery.viewer.scene.shadowMap, "_lightDirectionEC")));
        let bias = shadowquery.viewer.scene.shadowMap._pointBias;
        uniforms.shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness.push(Cesium.Cartesian4.fromElements(
            bias.normalOffsetScale,
            shadowquery.viewer.scene.shadowMap._distance,
            shadowquery.viewer.scene.shadowMap.maximumDistance,
            // 0.0,
            shadowquery.viewer.scene._darkness,
            new Cesium.Cartesian4()
        ));
        let scratchTexelStepSize = new Cesium.Cartesian2();
        let texelStepSize = scratchTexelStepSize;
        texelStepSize.x = 1.0 / shadowquery.viewer.scene.shadowMap._textureSize.x;
        texelStepSize.y = 1.0 / shadowquery.viewer.scene.shadowMap._textureSize.y;
        uniforms.shadowMap_texelSizeDepthBiasAndNormalShadingSmooth.push(Cesium.Cartesian4.fromElements(
            texelStepSize.x,
            texelStepSize.y,
            bias.depthBias,
            bias.normalShadingSmooth,
            new Cesium.Cartesian4()
        ));
        uniforms.camera_projection_matrix.push(shadowquery.viewer.scene.shadowMap._lightCamera.frustum.projectionMatrix);
        uniforms.camera_view_matrix.push(shadowquery.viewer.scene.shadowMap._lightCamera.viewMatrix);
    }
    // this.viewer.scene.postProcessStages.remove(this.postStage);
    poststage = shadowquery.viewer.scene.postProcessStages.add(new Cesium.PostProcessStage({
        fragmentShader: fs,
        uniforms: uniforms
    }));
}



//#region 定义一个Trangles类
function Trangles(options) {
    this._viewer = options.viewer
    this._modelMatrix = options.modelMatrix
    this.arr = options.arr;

}
//用prototype给定方法和属性
Trangles.prototype.getCommand = function(context) {
    //顶点着色器
    let v = `
        in vec3 position3DHigh;
        in vec3 position3DLow;
        void main()
        {
          vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
          p = czm_modelViewProjectionRelativeToEye * p;
          gl_Position = p;
          gl_PointSize=10.0;
        }
    `;
    //片元着色器
    let f = `
        out vec4 gFragColor;
        void main()
        {
            gFragColor = vec4(0,1,0,1);
        }
    `;
    //shaderProgram将两个着色器合并
    var shaderProgram = Cesium.ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: v,
        fragmentShaderSource: f
    })
    //渲染状态
    var renderState = Cesium.RenderState.fromCache({
        depthTest: {
            enabled: false
        },
        depthMask: false,
        blending: Cesium.BlendingState.ALPHA_BLEND
    })
    //索引数组Buffer
    var indexBuffer = Cesium.Buffer.createIndexBuffer({
        context: context,
        typedArray: new Uint32Array([0, 1, 2]), //索引顺序
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT
    })
    //顶点数组Buffer
    var vertexBuffer = Cesium.Buffer.createVertexBuffer({
        context: context,
        typedArray: Cesium.ComponentDatatype.createTypedArray(
            Cesium.ComponentDatatype.FLOAT,
            this.arr //顶点位置数组
        ),
        usage: Cesium.BufferUsage.STATIC_DRAW
    })
    //用来表示逐个顶点的信息
    var attributes = []
    attributes.push({
        index: 0,
        vertexBuffer: vertexBuffer,
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        normalize: false
    })
    //顶点数组（设置顶点属性和索引Buffer）
    var vertexArray = new Cesium.VertexArray({
        context: context,
        attributes: attributes,
        indexBuffer: indexBuffer
    })

    //新建一个DrawCommand
    this.pointCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.POINTS,
        shaderProgram: shaderProgram,
        renderState: renderState,
        vertexArray: vertexArray,
        pass: Cesium.Pass.OPAQUE,
        modelMatrix: this._modelMatrix,
        receiveShadows:true
    })
}
Trangles.prototype.destroy = function() {
    //this.arr = [];
}
Trangles.prototype.update = function(frameState) {
    if (this.pointCommand) {
        var commandList = frameState.commandList
        commandList.push(this.pointCommand)
        this._viewer.scene.requestRender()
    } else {
        this.getCommand(this._viewer.scene.context)
    }
}
//#endregion

//#region
//定义一个multipoint类
function Multipoint(options) {
    this._viewer = options.viewer
    this._modelMatrix = options.modelMatrix
    this.arr = options.arr;
    this.uniforms=options.uniforms;

}
//用prototype给定方法和属性
Multipoint.prototype.getCommand = function(context) {
    //顶点着色器
    let v = `
        #version 300 es
        in vec3 position3DHigh;
        in vec3 position3DLow;
        out vec4 v_positionWC;
        out vec4 v_positionEC;
        out vec3 v_logPositionEC;
        void main()
        {
            vec4 v_positionWC = vec4(position3DHigh+position3DLow,1.0); // 得到世界坐标
            v_positionEC = czm_modelViewRelativeToEye * v_positionWC;
            vec4 p = czm_translateRelativeToEye(position3DHigh, position3DLow);
            p = czm_modelViewProjectionRelativeToEye * p;
            gl_Position = p;
            vec3 logPositionEC = (czm_inverseProjection * gl_Position).xyz;
            v_logPositionEC = logPositionEC;
            gl_PointSize = 4.0;
        }
    `;
    //片元着色器
    let f = `
        #version 300 es
        in vec4 v_positionWC;
        in vec4 v_positionEC;
        #ifdef LOG_DEPTH 
            in vec3 v_logPositionEC;
        #endif 
        uniform sampler2D shadowMap_textureCube[4];
        uniform vec3 shadowMap_lightDirectionEC[4];
        uniform vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[4];
        uniform vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[4];
        uniform vec4 shadowMap_cascadeSplitsCur[8];
        uniform mat4 shadowMap_cascadeMatricesCur[16];

        vec4 getPositionEC()  {
            #ifndef LOG_DEPTH 
                return czm_windowToEyeCoordinates(gl_FragCoord);
            # else 
                return vec4(v_logPositionEC, 1.0);
            #endif 
        }
        mat4 czm_cascadeMatrixCur(vec4 weights,mat4 matrics0,mat4 matrics1,mat4 matrics2,mat4 matrics3)
        {
            return matrics0 * weights.x + matrics1 * weights.y + matrics2 * weights.z + matrics3 * weights.w;
        }
        vec4 czm_cascadeWeightsCur(vec4 shadowMap_cascadeSplitsCur0,vec4 shadowMap_cascadeSplitsCur1,float depthEye) {
            vec4 near = step(shadowMap_cascadeSplitsCur0, vec4(depthEye));
            vec4 far = step(depthEye, shadowMap_cascadeSplitsCur1);
            return near * far;
        }
        float getvisibility(int index,vec3 normalEC,vec4 wordPos){
            czm_shadowParameters shadowParameters;
            vec4 shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow;
            vec4 shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow;
            float maxDepth;
            vec4 positionECNow;
            positionECNow=getPositionEC();
            vec3 shadowMap_lightDirectionECNow;
            float depthNow;
        
            if(index==0){
                shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[0];
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[0];
                shadowMap_lightDirectionECNow=shadowMap_lightDirectionEC[0];
                maxDepth = shadowMap_cascadeSplitsCur[1].w;
                // positionECNow=camera_view_matrix[0] * wordPos;
            }
            else if(index==1){
                shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[1];
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[1];
                shadowMap_lightDirectionECNow=shadowMap_lightDirectionEC[1];
                maxDepth = shadowMap_cascadeSplitsCur[3].w;
                // positionECNow=camera_view_matrix[1] * wordPos;
            }
            else if(index==2){
                shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[2];
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[2];
                shadowMap_lightDirectionECNow=shadowMap_lightDirectionEC[2];
                maxDepth = shadowMap_cascadeSplitsCur[5].w;
                // positionECNow=camera_view_matrix[2] * wordPos;
            }
            else if(index==3){
                shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow=shadowMap_texelSizeDepthBiasAndNormalShadingSmooth[3];
                shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow=shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness[3];
                shadowMap_lightDirectionECNow=shadowMap_lightDirectionEC[3];
                maxDepth = shadowMap_cascadeSplitsCur[7].w;
                // positionECNow=camera_view_matrix[3] * wordPos;
            }
            depthNow= -positionECNow.z;
            shadowParameters.texelStepSize = shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow.xy;
            shadowParameters.depthBias = shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow.z;
            shadowParameters.normalShadingSmooth = shadowMap_texelSizeDepthBiasAndNormalShadingSmoothNow.w;
            shadowParameters.darkness = shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow.w;

            if (depthNow > maxDepth)  {
                    return 1.0;    
            }
            vec4 weights;
            if(index==0){
                weights = czm_cascadeWeightsCur(shadowMap_cascadeSplitsCur[0],shadowMap_cascadeSplitsCur[1],depthNow);
            }
            else if(index==1){
                weights = czm_cascadeWeightsCur(shadowMap_cascadeSplitsCur[2],shadowMap_cascadeSplitsCur[3],depthNow);
            }
            else if(index==2){
                weights = czm_cascadeWeightsCur(shadowMap_cascadeSplitsCur[4],shadowMap_cascadeSplitsCur[5],depthNow);
            }
            else if(index==3){
                weights = czm_cascadeWeightsCur(shadowMap_cascadeSplitsCur[6],shadowMap_cascadeSplitsCur[7],depthNow);
            }
            float nDotL = clamp(dot(normalEC, shadowMap_lightDirectionECNow), 0.0, 1.0);
            vec4 shadowPosition ;
            if(index==0){
                shadowPosition = czm_cascadeMatrixCur(weights,shadowMap_cascadeMatricesCur[0],shadowMap_cascadeMatricesCur[1],shadowMap_cascadeMatricesCur[2],shadowMap_cascadeMatricesCur[3]) * positionECNow;            
            }
            else if(index==1){
                shadowPosition = czm_cascadeMatrixCur(weights,shadowMap_cascadeMatricesCur[4],shadowMap_cascadeMatricesCur[5],shadowMap_cascadeMatricesCur[6],shadowMap_cascadeMatricesCur[7]) * positionECNow;
            }
            else if(index==2){
                shadowPosition = czm_cascadeMatrixCur(weights,shadowMap_cascadeMatricesCur[8],shadowMap_cascadeMatricesCur[9],shadowMap_cascadeMatricesCur[10],shadowMap_cascadeMatricesCur[11]) * positionECNow;
            }
            else if(index==3){
                shadowPosition = czm_cascadeMatrixCur(weights,shadowMap_cascadeMatricesCur[12],shadowMap_cascadeMatricesCur[13],shadowMap_cascadeMatricesCur[14],shadowMap_cascadeMatricesCur[15]) * positionECNow;
            }
            shadowParameters.texCoords = shadowPosition.xy;
            shadowParameters.depth = shadowPosition.z;
            shadowParameters.nDotL = nDotL;
    
            float visibility;
            if(index==0){
                visibility = czm_shadowVisibility(shadowMap_textureCube[0], shadowParameters);
            }
            else if(index==1){
                visibility = czm_shadowVisibility(shadowMap_textureCube[1], shadowParameters);;
            }
            else if(index==2){
                visibility = czm_shadowVisibility(shadowMap_textureCube[2], shadowParameters);
            }
            else if(index==3){
                visibility = czm_shadowVisibility(shadowMap_textureCube[3], shadowParameters);
            }

            float shadowMapMaximumDistance = shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarknessNow.z;
            float fade = max((depthNow - shadowMapMaximumDistance * 0.8) / (shadowMapMaximumDistance * 0.2), 0.0);
            visibility = mix(visibility, 1.0, fade);
            if(visibility>0.3)
            {
                return 1.0;
            }
            else
            {
                return 0.0;
            }
            // return visibility;
        }
        
        out vec4 gFragColor;
        void main()
        {
            vec4 wordPos = v_positionWC; // 世界坐标
            // vec4 vcPos = v_positionEC; // 虚拟相机中坐标
            vec4 positionEC = getPositionEC(); // 这里有问题
            // vec4 positionEC; // 虚拟相机中坐标
            vec3 normalEC =vec3(1.0);
            // float depth = -positionEC.z; 
            gFragColor = vec4(0,1,0,1);
            float visibilitytotal = 0.0;
            for(int i=0;i<4;i++){
                visibilitytotal = getvisibility(i,normalEC,wordPos);
            }
            if(visibilitytotal > 3.0){
                //gFragColor.rgb=vec3(1.0,0.0,0.0);
                gFragColor = vec4(1,0,0,1);
            }
            else if(visibilitytotal > 2.0 && visibilitytotal <= 3.0){
                //gFragColor.rgb=vec3(1.0,1.0,0.0);
                gFragColor = vec4(1,1,0,1);
            }
            else if(visibilitytotal > 1.0 && visibilitytotal <= 2.0){
                //gFragColor.rgb=vec3(0.0,1.0,0.0);
                gFragColor = vec4(0,1,0,1);
            }
            else{   
                //gFragColor.rgb=vec3(0.0,0.0,1.0);
                gFragColor = vec4(0,0,1,1);
            }
            // gFragColor.rgb*=visibilitytotal;
        }
    `;
    //shaderProgram将两个着色器合并
    var shaderProgram = Cesium.ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: v,
        fragmentShaderSource: f
    })
    //渲染状态
    var renderState = Cesium.RenderState.fromCache({
        depthTest: {
            enabled: true
        },
        depthMask: false,
        blending: Cesium.BlendingState.ALPHA_BLEND
    })
    //索引数组Buffer
    let indexbuffer=[];
    for(let i=0;i<this.arr.length/3;i++){
        indexbuffer.push(i);
    }
    var indexBuffer = Cesium.Buffer.createIndexBuffer({
        context: context,
        typedArray: new Uint32Array(indexbuffer), //索引顺序
        usage: Cesium.BufferUsage.STATIC_DRAW,
        indexDatatype: Cesium.IndexDatatype.UNSIGNED_INT
    })
    //顶点数组Buffer
    var vertexBuffer = Cesium.Buffer.createVertexBuffer({
        context: context,
        typedArray: Cesium.ComponentDatatype.createTypedArray(
            Cesium.ComponentDatatype.FLOAT,
            this.arr //顶点位置数组
        ),
        usage: Cesium.BufferUsage.STATIC_DRAW
    })
    //用来表示逐个顶点的信息
    var attributes = []
    attributes.push({
        index: 0,
        vertexBuffer: vertexBuffer,
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        normalize: false
    })
    //顶点数组（设置顶点属性和索引Buffer）
    var vertexArray = new Cesium.VertexArray({
        context: context,
        attributes: attributes,
        indexBuffer: indexBuffer
    })

    //新建一个DrawCommand
    this.pointCommand = new Cesium.DrawCommand({
        primitiveType: Cesium.PrimitiveType.POINTS,
        shaderProgram: shaderProgram,
        renderState: renderState,
        vertexArray: vertexArray,
        pass: Cesium.Pass.OPAQUE,
        modelMatrix: this._modelMatrix,
        receiveShadows:false,
        uniformMap:this.uniforms,

    })
}
Multipoint.prototype.destroy = function() {
    //this.arr = [];
}
Multipoint.prototype.update = function(frameState) {
    if (this.pointCommand) {
        var commandList = frameState.commandList
        commandList.push(this.pointCommand)
        this._viewer.scene.requestRender()
    } else {
        this.getCommand(this._viewer.scene.context)
    }
}
//#endregion

export default {
    ShadowQuery
}
