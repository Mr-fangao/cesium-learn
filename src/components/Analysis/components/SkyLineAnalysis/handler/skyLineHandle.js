import extractskyline from './extractSkyline';
import { GlobalState } from '@/buss/GlobalState';

const skyline1 = `
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform float length;
uniform vec4 color;
in vec2 v_textureCoordinates;
out vec4 gFragColor;
void main(void){
    float directions[3];
    directions[0] = -1.0;
    directions[1] = 0.0;
    directions[2] = 1.0;

    float scalars[3];
    scalars[0] = 3.0;
    scalars[1] = 10.0;
    scalars[2] = 3.0;

    float padx = 1.0 / czm_viewport.z;
    float pady = 1.0 / czm_viewport.w;

    #ifdef CZM_SELECTED_FEATURE
        bool selected = false;
        for (int i = 0; i < 3; ++i){
            float dir = directions[i];
            selected = selected || czm_selected(vec2(-padx, dir * pady));
            selected = selected || czm_selected(vec2(padx, dir * pady));
            selected = selected || czm_selected(vec2(dir * padx, -pady));
            selected = selected || czm_selected(vec2(dir * padx, pady));
            if (selected){
                break;
            }
        }
        if (!selected){
            gFragColor = vec4(color.rgb, 0.0);
            return;
        }
    #endif

    float horizEdge = 0.0;
    float vertEdge = 0.0;
    for (int i = 0; i < 3; ++i){
        float dir = directions[i];
        float scale = scalars[i];
        horizEdge -= texture(depthTexture, v_textureCoordinates + vec2(-padx, dir * pady)).x * scale;
        horizEdge += texture(depthTexture, v_textureCoordinates + vec2(padx, dir * pady)).x * scale;
        vertEdge -= texture(depthTexture, v_textureCoordinates + vec2(dir * padx, -pady)).x * scale;
        vertEdge += texture(depthTexture, v_textureCoordinates + vec2(dir * padx, pady)).x * scale;
    }

    float len = sqrt(horizEdge * horizEdge + vertEdge * vertEdge);
    vec4 origincolor = texture(colorTexture, v_textureCoordinates);
    gFragColor = vec4(color.rgb, len > length ? color.a : 0.0);
}`;

const skyline2 = `
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
in vec2 v_textureCoordinates;
out vec4 gFragColor;
void main(void){
    float depth = czm_readDepth(depthTexture, v_textureCoordinates);
    vec4 color = texture(colorTexture, v_textureCoordinates);
    if(depth<1.0 - 0.000001){
        gFragColor = color;
    }
    else{
        gFragColor = vec4(1.0,0.0,0.0,1.0);
    }
}`;

const skyline3 = `
uniform sampler2D colorTexture;
uniform sampler2D redTexture;
uniform sampler2D silhouetteTexture;
in vec2 v_textureCoordinates;
out vec4 gFragColor;
void main(void){
    vec4 redcolor=texture(redTexture, v_textureCoordinates);
    vec4 silhouetteColor = texture(silhouetteTexture, v_textureCoordinates);
    vec4 color = texture(colorTexture, v_textureCoordinates);
    if(redcolor.r == 1.0){
        gFragColor = mix(color, vec4(1.0,0.0,0.0,1.0), silhouetteColor.a);
    }
    else{
        gFragColor = color;
    }
}`;

//提取天际线
function extractSkyline() {
    let viewer = GlobalState.getInstance().viewer;
    this.collection = viewer.scene.postProcessStages;
    this.edgeDetection=new Cesium.PostProcessStage({
        name : 'czm_edge_detection_' + "ddddddd",
        fragmentShader: skyline1,
        uniforms : {
            length : 0.1,
            color : Cesium.Color.clone(Cesium.Color.BLUE)
        }
    });
   // let edgeDetection = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    this.postProccessStage1 = new Cesium.PostProcessStage({
        name: 'czm_skylinetemp',
        fragmentShader: skyline2,
        // uniforms:{
        //     v_textureCoordinates: vec2
        // }
    });
    let postProccessStage2 = new Cesium.PostProcessStage({
        name: 'czm_skylinetemp1',
        fragmentShader: skyline3,
        uniforms: {
            redTexture: this.postProccessStage1.name,
            silhouetteTexture: this.edgeDetection.name
        }
    });
    this.skyLineStage = new Cesium.PostProcessStageComposite({
        name: 'czm_skyline',
        stages: [this.edgeDetection, this.postProccessStage1, postProccessStage2],
        //stages:[postProccessStage1, postProccessStage2],
        inputPreviousStageTexture: false,
        uniforms: this.edgeDetection.uniforms
    });
    this.collection.add(this.skyLineStage);
   // this.collection.add(this.edgeDetection);
    //this.collection.add(this.postProccessStage1)
}

function getCurrentSkylineData() {
	let viewer = GlobalState.getInstance().viewer;
	let canvasheight = viewer.canvas.height;
	let canvaswidth = viewer.canvas.width;
	let result={
		width: canvaswidth,
		height: canvasheight
	};

}

//输出二维天际线分析结果
function getSkyline2D() {
    //let data=GlobalState.getInstance().GetCurrentSkylineData(this.skyLineStage.name);
    let i=0;
    // let datalist=getCurrentSkylineData();
	let datalist=extractskyline.GetCurrentSkylineData(this.skyLineStage.name);
    // let canvas = $('.cesium-widget')[0].firstChild;
    // let canvas = this.collection.outputTexture._context.canvas;
    // let colorData = canvas.getPixelColor(150, 200);
	//获取二维天际线对象
	// let object = skyline.getSkyline2D();
    let data=[];
	for(let i=0;i<datalist.data.length;i++){
		data.push([datalist.data[i].windowx,datalist.data[i].windowy]);
	}
	let width = datalist.width;
	let height=datalist.height;
    console.log(data )
	let myChart = echarts.init(document.getElementById("skyline-map"));
	let option = {
		backgroundColor: "rgba(0,0,0,0)",
		grid: {
			top:'10%',
			bottom: '10%',
			right:'5%',
		},

		xAxis: {
			type: 'category',
			axisLine: {
				lineStyle: {
					color: "#fff"
				}
			},
			axisLabel: {
				show: false
			},
			axisTick: {
				show: false
			},
			min:0,
			max:width
		},
		yAxis: {
			type: 'value',
			axisLine: {
				lineStyle: {
					color: "#fff"
				}
			},
			axisLabel: {
				extStyle: {
                    color: '#fff',//坐标值得具体的颜色
                },
			},
			axisTick: {
				show: false
			},
			min: 0,
			max: height, // 或者height
		},
		series: [{
			// data: [820, 932, 901, 934, 1290, 1330, 1320],
			data: data,
			type: 'line',
			lineStyle:{
                color:"#22e8e2"
            },
            areaStyle:{
                color:{
                    type:'linear',
                    x:0,
                    y:0,
                    x2:0,
                    y2:1,
                    colorStops: [{
                        offset: 0, color: '#22e8e233' // 0% 处的颜色
                    }, {
                        offset: 1, color: '#049eff33' // 100% 处的颜色
                    }],
                    global: false // 缺省为 false
                }
            },
			// hoverAnimation: false,
		}]
	};
	myChart.setOption(option);
  //  return data;
}

//清除天际线
function clearSkyLine() {
    if(this.collection){
        this.collection.remove(this.skyLineStage);
        //this.collection.remove(this.postProccessStage1);
       // this.collection.remove(this.edgeDetection);
        //this.collection.remove(this.postProccessStage1)
    }
}

function checkskyline2d(){
    if(this.skyLineStage==null) return false;
    return true;
}

export default {
    extractSkyline,
    getSkyline2D,
    clearSkyLine,
	checkskyline2d
}
