class WallGradientMaterialPropertyForAirSpace {
	constructor(options) {
		this._definitionChanged = new Cesium.Event();
		this._color = undefined;
		this._colorSubscription = undefined;
		this.color1 = options.color1;
		this.color2 = options.color2;
		this.image = options.image;
	}
}
Object.defineProperties(WallGradientMaterialPropertyForAirSpace.prototype, {
	isConstant: {
		get: function () {
			return false;
		},
	},
	definitionChanged: {
		get: function () {
			return this._definitionChanged;
		},
	},
	color1: Cesium.createPropertyDescriptor("color1"),
	color2: Cesium.createPropertyDescriptor("color2"),
});

WallGradientMaterialPropertyForAirSpace.prototype.getType = function (time) {
	return "Gradientswall";
};
WallGradientMaterialPropertyForAirSpace.prototype.getValue = function (time, result) {
	if (!Cesium.defined(result)) {
		result = {};
	}
	result.color1 = this.color1._value;
	result.color2 = this.color2._value;
	result.image = this.image;
	return result;
};
WallGradientMaterialPropertyForAirSpace.prototype.equals = function (other) {
	return this === other || (other instanceof WallGradientMaterialPropertyForAirSpace && Property.equals(this._color, other._color));
};
// 添加材质
let source = `
    uniform sampler2D image;
    uniform vec4 color1;
	uniform vec4 color2;
    czm_material czm_getMaterial(czm_materialInput materialInput){
        czm_material material = czm_getDefaultMaterial(materialInput);
        // vec2 st = materialInput.st;
        // vec4 colorImage = texture(image, vec2(st.s, st.t));
        // material.alpha = 1.0 - colorImage.a;
        // material.diffuse = color.rgb*vec3(0.8);
        // material.emission = vec3(0.1);
		vec2 st = materialInput.st; 
		float gradient = 1.0-st.t; 

		// 将颜色从 sRGB 转换到线性空间
		vec3 linearColor1 = pow(color1.rgb, vec3(2.2)); // 转换 color1
		vec3 linearColor2 = pow(color2.rgb, vec3(2.2)); // 转换 color2

		// 颜色插值（在线性空间）
		vec3 mixedColor = mix(linearColor1, linearColor2, gradient);

		// 将插值结果转换回 sRGB 空间
		material.diffuse = pow(mixedColor, vec3(1.0 / 2.2));

		// 透明度插值
		material.alpha = mix(color1.a, color2.a, gradient);

        return material;
    }`;
Cesium.Material._materialCache.addMaterial("Gradientswall", {
	fabric: {
		type: "Gradientswall",
		uniforms: {
			color1: new Cesium.Color(0.5, 0.5, 0.5, 1.0),
			color2: new Cesium.Color(0.5, 0.5, 0.5, 1.0),
			image: "/materials/WallImage5.png",
		},
		source: source,
	},
	translucent: function (material) {
		return material.uniforms.color1.alpha <= 1.0;
	},
});
// 类赋予Cesium 便于调用
Cesium.WallGradientMaterialPropertyForAirSpace = WallGradientMaterialPropertyForAirSpace;
