const SkyBoxVS = `
#define PI 3.141592653589793;
in vec3 position;
out vec3 v_texCoord;

uniform mat3 u_rotateMatrix;
uniform float u_speed;
uniform float u_rotate;

void main()
{
    float t = clamp(fract(czm_frameNumber * u_speed / 1000.0),0.0,1.0);
	float angle = t*2.*PI;
	mat3 rotate = mat3(cos(angle),-sin(angle),0.,sin(angle),cos(angle),0.,0.,0.,1.);
	vec3 p = vec3(1.);
	if(u_rotate == 1.0){
		p = czm_viewRotation  * u_rotateMatrix * rotate * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));
	}else{
		p = czm_viewRotation  * u_rotateMatrix * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));
    }
    gl_Position = czm_projection  * vec4(p, 1.0);
	v_texCoord = position.xyz;
}

`;
const SkyBoxFS = `
uniform samplerCube u_cubeMap;

in vec3 v_texCoord;

void main()
{
    vec4 color = czm_textureCube(u_cubeMap, normalize(v_texCoord));
    out_FragColor = vec4(czm_gammaCorrect(color).rgb, czm_morphTime);
}

`;
const skyboxMatrix3 = new Cesium.Matrix3();
/**
 * A sky box around the scene to draw stars.  The sky box is defined using the True Equator Mean Equinox (TEME) axes.
 * <p>
 * This is only supported in 3D.  The sky box is faded out when morphing to 2D or Columbus view.  The size of
 * the sky box must not exceed {@link Scene#maximumCubeMapSize}.
 * </p>
 *
 * @alias SkyBox
 * @constructor
 *
 * @param {object} options Object with the following properties:
 * @param {object} [options.sources] The source URL or <code>Image</code> object for each of the six cube map faces.  See the example below.
 * @param {boolean} [options.show=true] Determines if this primitive will be shown.
 *
 *
 * @example
 * scene.skyBox = new Cesium.SkyBox({
 *   sources : {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 *   }
 * });
 *
 * @see Scene#skyBox
 * @see Transforms.computeTemeToPseudoFixedMatrix
 */
function SkyBox(options) {
	/**
	 * The sources used to create the cube map faces: an object
	 * with <code>positiveX</code>, <code>negativeX</code>, <code>positiveY</code>,
	 * <code>negativeY</code>, <code>positiveZ</code>, and <code>negativeZ</code> properties.
	 * These can be either URLs or <code>Image</code> objects.
	 *
	 * @type {object}
	 * @default undefined
	 */
	this.sources = options.sources;
	this._sources = undefined;
	// 是否旋转
	this.isRotate = options?.rotate ?? false;
	// 旋转速度
	this.rotateSpeed = options?.speed ?? 0.01;

	/**
	 * Determines if the sky box will be shown.
	 *
	 * @type {boolean}
	 * @default true
	 */
	this.show = Cesium.defaultValue(options.show, true);

	this._command = new Cesium.DrawCommand({
		modelMatrix: Cesium.Matrix4.clone(Cesium.Matrix4.IDENTITY),
		owner: this,
	});
	this._cubeMap = undefined;

	this._attributeLocations = undefined;
	this._useHdr = undefined;
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * get the draw commands needed to render this primitive.
 * <p>
 * Do not call this function directly.  This is documented just to
 * list the exceptions that may be propagated when the scene is rendered:
 * </p>
 *
 * @exception {Cesium.DeveloperError} this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.
 * @exception {Cesium.DeveloperError} this.sources properties must all be the same type.
 */
SkyBox.prototype.update = function (frameState, useHdr) {
	const that = this;

	if (!this.show) {
		return undefined;
	}

	if (frameState.mode !== Cesium.SceneMode.SCENE3D && frameState.mode !== Cesium.SceneMode.MORPHING) {
		return undefined;
	}

	// The sky box is only rendered during the render pass; it is not pickable, it doesn't cast shadows, etc.
	if (!frameState.passes.render) {
		return undefined;
	}

	const context = frameState.context;

	if (this._sources !== this.sources) {
		this._sources = this.sources;
		const sources = this.sources;

		//>>includeStart('debug', pragmas.debug);
		if (
			!Cesium.defined(sources.positiveX) ||
			!Cesium.defined(sources.negativeX) ||
			!Cesium.defined(sources.positiveY) ||
			!Cesium.defined(sources.negativeY) ||
			!Cesium.defined(sources.positiveZ) ||
			!Cesium.defined(sources.negativeZ)
		) {
			throw new Cesium.DeveloperError(
				"this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.",
			);
		}

		if (
			typeof sources.positiveX !== typeof sources.negativeX ||
			typeof sources.positiveX !== typeof sources.positiveY ||
			typeof sources.positiveX !== typeof sources.negativeY ||
			typeof sources.positiveX !== typeof sources.positiveZ ||
			typeof sources.positiveX !== typeof sources.negativeZ
		) {
			throw new Cesium.DeveloperError("this.sources properties must all be the same type.");
		}
		//>>includeEnd('debug');

		if (typeof sources.positiveX === "string") {
			// Given urls for cube-map images.  Load them.
			Cesium.loadCubeMap(context, this._sources).then(function (cubeMap) {
				that._cubeMap = that._cubeMap && that._cubeMap.destroy();
				that._cubeMap = cubeMap;
			});
		} else {
			this._cubeMap = this._cubeMap && this._cubeMap.destroy();
			this._cubeMap = new Cesium.CubeMap({
				context: context,
				source: sources,
			});
		}
	}

	const command = this._command;
	command.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(frameState.camera._positionWC);

	if (!Cesium.defined(command.vertexArray)) {
		command.uniformMap = {
			u_cubeMap: function () {
				return that._cubeMap;
			},
			u_rotateMatrix: function () {
				return Cesium.Matrix4.getRotation(command.modelMatrix, skyboxMatrix3);
			},
			u_speed: function () {
				return that.rotateSpeed;
			},
			u_rotate: function () {
				return that.isRotate == false ? 0 : 1;
			},
		};

		const geometry = Cesium.BoxGeometry.createGeometry(
			Cesium.BoxGeometry.fromDimensions({
				dimensions: new Cesium.Cartesian3(2.0, 2.0, 2.0),
				vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
			}),
		);
		const attributeLocations = (this._attributeLocations = Cesium.GeometryPipeline.createAttributeLocations(geometry));

		command.vertexArray = Cesium.VertexArray.fromGeometry({
			context: context,
			geometry: geometry,
			attributeLocations: attributeLocations,
			bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
		});

		command.renderState = Cesium.RenderState.fromCache({
			blending: Cesium.BlendingState.ALPHA_BLEND,
		});
	}

	if (!Cesium.defined(command.shaderProgram) || this._useHdr !== useHdr) {
		const fs = new Cesium.ShaderSource({
			defines: [useHdr ? "HDR" : ""],
			sources: [SkyBoxFS],
		});
		command.shaderProgram = Cesium.ShaderProgram.fromCache({
			context: context,
			vertexShaderSource: SkyBoxVS,
			fragmentShaderSource: fs,
			attributeLocations: this._attributeLocations,
		});
		this._useHdr = useHdr;
	}

	if (!Cesium.defined(this._cubeMap)) {
		return undefined;
	}

	return command;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link Cesium.DeveloperError} exception.
 *
 * @returns {boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
 *
 * @see SkyBox#destroy
 */
SkyBox.prototype.isDestroyed = function () {
	return false;
};

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link Cesium.DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {Cesium.DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * skyBox = skyBox && skyBox.destroy();
 *
 * @see SkyBox#isDestroyed
 */
SkyBox.prototype.destroy = function () {
	const command = this._command;
	command.vertexArray = command.vertexArray && command.vertexArray.destroy();
	command.shaderProgram = command.shaderProgram && command.shaderProgram.destroy();
	this._cubeMap = this._cubeMap && this._cubeMap.destroy();
	return Cesium.destroyObject(this);
};
export default SkyBox;
