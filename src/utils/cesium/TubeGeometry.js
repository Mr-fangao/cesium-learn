/**
 * Created by wqy
 * Date 2023/2/17 15:04
 * Description
 */
class TubePath extends THREE.Curve {
	constructor(cartesianlist) {
		super();
		this.cartesianlist = cartesianlist;
	}
	getPoint(t, optionalTarget = new THREE.Vector3()) {
		let result = this.GetCartesianBylerp(this.cartesianlist, t);
		return optionalTarget.set(result.x, result.y, result.z);
	}
	/**
	 * 获取一连串Cartesian坐标位置构成的线段中指定占比的位置，类似飞行浏览根据当前时间在总时长的占比来取当前时间的坐标
	 * @param cartesianlist
	 * @param lerp 占比 0-1
	 * @constructor wangqiuyan
	 */
	GetCartesianBylerp(cartesianlist, lerp) {
		let lens = [];
		let totallen = 0;

		for (let i = 0; i < cartesianlist.length - 1; i++) {
			lens.push(Cesium.Cartesian3.distance(cartesianlist[i], cartesianlist[i + 1]));
			totallen += lens[i];
		}
		let curtotallerp = 0;
		for (let i = 0; i < lens.length; i++) {
			if (curtotallerp == lerp) return cartesianlist[i];
			const curlerp = lens[i] / totallen;
			const nexttotallerp = curtotallerp + curlerp;
			if (nexttotallerp == lerp) return cartesianlist[i + 1];
			if (nexttotallerp < lerp) {
				curtotallerp += curlerp;
			} else {
				let jisuanlerp = lerp - curtotallerp;
				jisuanlerp = jisuanlerp / curlerp;
				return Cesium.Cartesian3.lerp(cartesianlist[i], cartesianlist[i + 1], jisuanlerp, new Cesium.Cartesian3());
			}
		}
		return cartesianlist[cartesianlist.length - 1];
	}
}
// three geometry
class ThreeTubeGeometry extends THREE.BufferGeometry {
	constructor(path, tubularSegments = 64, radius = 1, radialSegments = 8, closed = false) {
		super();

		this.type = "TubeGeometry";

		this.parameters = {
			path: path,
			tubularSegments: tubularSegments,
			radius: radius,
			radialSegments: radialSegments,
			closed: closed,
		};

		const frames = path.computeFrenetFrames(tubularSegments, closed);

		// expose internals

		this.tangents = frames.tangents;
		this.normals = frames.normals;
		this.binormals = frames.binormals;

		// helper variables

		const vertex = new THREE.Vector3();
		const normal = new THREE.Vector3();
		const uv = new THREE.Vector2();
		let P = new THREE.Vector3();

		// buffer

		const vertices = [];
		const normals = [];
		const uvs = [];
		const indices = [];

		// create buffer data

		generateBufferData();

		// build geometry

		this.setIndex(indices);
		this.setAttribute("position", new THREE.Float64BufferAttribute(vertices, 3));
		this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
		this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

		// functions

		function generateBufferData() {
			for (let i = 0; i < tubularSegments; i++) {
				generateSegment(i);
			}

			// if the geometry is not closed, generate the last row of vertices and normals
			// at the regular position on the given path
			//
			// if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

			generateSegment(closed === false ? tubularSegments : 0);

			// uvs are generated in a separate function.
			// this makes it easy compute correct values for closed geometries

			generateUVs();

			// finally create faces

			generateIndices();
		}

		function generateSegment(i) {
			// we use getPointAt to sample evenly distributed points from the given path

			P = path.getPointAt(i / tubularSegments, P);

			// retrieve corresponding normal and binormal

			const N = frames.normals[i];
			const B = frames.binormals[i];

			// generate normals and vertices for the current segment

			for (let j = 0; j <= radialSegments; j++) {
				let v = (j / radialSegments) * Math.PI * 2;
				const sin = Math.sin(v);
				const cos = -Math.cos(v);

				// normal

				normal.x = cos * N.x + sin * B.x;
				normal.y = cos * N.y + sin * B.y;
				normal.z = cos * N.z + sin * B.z;
				normal.normalize();

				normals.push(normal.x, normal.y, normal.z);

				// vertex

				vertex.x = P.x + radius * normal.x;
				vertex.y = P.y + radius * normal.y;
				vertex.z = P.z + radius * normal.z;

				vertices.push(vertex.x, vertex.y, vertex.z);
			}
		}

		function generateIndices() {
			for (let j = 1; j <= tubularSegments; j++) {
				for (let i = 1; i <= radialSegments; i++) {
					const a = (radialSegments + 1) * (j - 1) + (i - 1);
					const b = (radialSegments + 1) * j + (i - 1);
					const c = (radialSegments + 1) * j + i;
					const d = (radialSegments + 1) * (j - 1) + i; // faces

					indices.push(a, b, d);
					indices.push(b, c, d);
				}
			}
		}

		function generateUVs() {
			for (let i = 0; i <= tubularSegments; i++) {
				for (let j = 0; j <= radialSegments; j++) {
					uv.x = i / tubularSegments;
					uv.y = j / radialSegments;
					uvs.push(uv.x, uv.y);
				}
			}
		}
	}
	toJSON() {
		const data = super.toJSON();

		data.path = this.parameters.path.toJSON();

		return data;
	}

	static fromJSON(data) {
		// This only works for built-in curves (e.g. CatmullRomCurve3).
		// User defined curves or instances of CurvePath will not be deserialized.
		return new TubeGeometry(
			new Curves[data.path.type]().fromJSON(data.path),
			data.tubularSegments,
			data.radius,
			data.radialSegments,
			data.closed,
		);
	}
}
// 绘制geometry
function createTubeGeometry(option) {
	let path = option.path;
	let radius = option.radius ?? 1;
	let radialSegments = option.radialSegments ?? 8;
	let tubularSegments = option.tubularSegments ?? 100;
	let threeGeometry = new ThreeTubeGeometry(path, tubularSegments, radius, radialSegments, false, false);
	let cesiumGeometry = new Cesium.Geometry({
		attributes: {
			position: new Cesium.GeometryAttribute({
				componentDatatype: Cesium.ComponentDatatype.DOUBLE,
				componentsPerAttribute: 3,
				values: threeGeometry.attributes.position.array,
			}),
			normal: new Cesium.GeometryAttribute({
				componentDatatype: Cesium.ComponentDatatype.FLOAT,
				componentsPerAttribute: 3,
				values: threeGeometry.attributes.normal.array,
			}),
			st: new Cesium.GeometryAttribute({
				componentDatatype: Cesium.ComponentDatatype.FLOAT,
				componentsPerAttribute: 2,
				values: threeGeometry.attributes.uv.array,
			}),
		},
		indices: threeGeometry.index.array,

		primitiveType: Cesium.PrimitiveType.TRIANGLES,
		boundingSphere: Cesium.BoundingSphere.fromVertices(threeGeometry.attributes.position.array),
	});
	return cesiumGeometry;
}
// 绘制appearance
function createTubeAppearance() {
	let appearance = new Cesium.PerInstanceColorAppearance({
		vertexShaderSource: `
		
			in vec3 position3DHigh;
			in vec3 position3DLow;
			in vec3 normal;
			in vec4 color;
			in float batchId;
			in vec2 st;

			out vec3 v_positionEC;
			out vec3 v_normalEC;
			out vec4 v_color;
			out vec2 v_textureCoordinates;

			void main()
			{
			vec4 p = czm_computePosition();

			v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
			v_normalEC = czm_normal * normal;                         // normal in eye coordinates
			v_color = color;

			v_textureCoordinates=st;
			gl_Position = czm_modelViewProjectionRelativeToEye * p;
			}

						`,
		fragmentShaderSource: `
						in vec3 v_positionEC;
			in vec3 v_normalEC;
			in vec4 v_color;
			in vec2 v_textureCoordinates;

			float random (vec2 st) {
			return fract(sin(dot(st.xy,
							vec2(1267.9898,23768.233)))*
			445.5453123);
			}


			void main()
			{
			vec2 st = v_textureCoordinates;
			float rnd = random( st );

			vec3 positionToEyeEC = -v_positionEC;

			vec3 normalEC = normalize(v_normalEC);
			#ifdef FACE_FORWARD
			normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
			#endif

			vec4 color = czm_gammaCorrect(v_color);

			czm_materialInput materialInput;
			materialInput.normalEC = normalEC;
			materialInput.positionToEyeEC = positionToEyeEC;
			czm_material material = czm_getDefaultMaterial(materialInput);
			//material.diffuse = color.rgb;
			material.diffuse = mix(color.rgb,step(vec3(0.8),vec3(rnd))*0.5,0.25);
			// material.alpha = color.a;
			material.specular = 0.82;
			material.shininess=3.1;

			// gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
			//     fragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
			out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);

			}

			`,
	});
	// let appearance = new Cesium.PerInstanceColorAppearance({
	// 	flat: true,
	// 	translucent: false,
	// });
	return appearance;
}
// 绘制appearance
function createTubeAppearance2() {
	let appearance = new Cesium.PerInstanceColorAppearance({
		translucent: false,
		vertexShaderSource: `
		#version 300 es
		in vec3 position3DHigh;
		in vec3 position3DLow;
		in vec3 normal;
		in vec4 color;
		in float batchId;
		in vec2 st;

		out vec3 v_positionEC;
		out vec3 v_normalEC;
		out vec4 v_color;



		out vec2 v_textureCoordinates;



		void main()
		{
		vec4 p = czm_computePosition();

		v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
		v_normalEC = czm_normal * normal;                         // normal in eye coordinates
		v_color = color;

		v_textureCoordinates=st;
		gl_Position = czm_modelViewProjectionRelativeToEye * p;
		}

		`,
		fragmentShaderSource: `
		in vec3 v_positionEC;
		in vec3 v_normalEC;
		in vec4 v_color;
		in vec2 v_textureCoordinates;


		float random (vec2 st) {
		return fract(sin(dot(st.xy,
		vec2(1267.9898,23768.233)))*
		445.5453123);
		}


		void main()
		{
		vec2 st = v_textureCoordinates;
		float rnd = random( st );

		vec3 positionToEyeEC = -v_positionEC;

		vec3 normalEC = normalize(v_normalEC);
		#ifdef FACE_FORWARD
		normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
		#endif

		vec4 color = czm_gammaCorrect(v_color);

		czm_materialInput materialInput;
		materialInput.normalEC = normalEC;
		materialInput.positionToEyeEC = positionToEyeEC;
		czm_material material = czm_getDefaultMaterial(materialInput);
		//material.diffuse = color.rgb;
		material.diffuse = mix(color.rgb,step(vec3(0.8),vec3(rnd))*0.5,0.25);
		// material.alpha = color.a;
		material.alpha = 1.0;
		material.specular = 0.82;
		material.shininess=3.1;

		// gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
		//  fragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
		out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);

		}

		`,
	});
	return appearance;
}
// 绘制tube
function createTubePrimitive(option) {
	let path = option.path;
	let radius = option.radius ?? 1;
	let radialSegments = option.radialSegments ?? 8;
	let tubularSegments = option.tubularSegments ?? 100;
	let color = option.color ?? Cesium.Color.fromCssColorString("#0070c0").withAlpha(0.9);
	let geometry = createTubeGeometry({
		path: path,
		radius: radius,
		radialSegments: radialSegments,
		tubularSegments: tubularSegments,
	});
	let appearance = createTubeAppearance();
	let tubePrimitive = new Cesium.Primitive({
		geometryInstances: new Cesium.GeometryInstance({
			geometry: geometry,
			attributes: {
				color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
			},
		}),
		appearance: appearance,
		asynchronous: false,
	});
	return tubePrimitive;
}
/**
 * @Author: dongnan
 * @Description: 增加高度
 * @Date: 2023-02-13 18:38:17
 * @param {Array} list [[x,y],[x,y]]
 * @param {number} height 统一叠加高度
 * @return {Array} [cartesian3,cartesian3]
 */
function plusListHeight(list, height) {
	height = Cesium.defaultValue(height, 0);
	let result = [];
	list.some((item) => {
		result.push(Cesium.Cartesian3.fromDegrees(item[0], item[1], (item[2] ? item[2] : 0) + height));
	});
	return result;
}

export { createTubePrimitive, TubePath, plusListHeight, createTubeAppearance2 };
