'use strict';
import { GlobalState } from '@/buss/GlobalState';

let SearchType_Enum = {
	Ordinary_Search: 0,//普通搜索 指邻域9像素
	LeftEdgeTouch_Search: 1,//触碰到左边界的搜索 搜索当前列和其右边一列
	TopEdgeTouch_Search: 2,//触碰到上边界的搜索 搜索当前行和下面一行
	BottomEdgeTouch_Search: 3, //触碰到下边界的搜索 搜索当前行和上面一行
	LeftTopEdgeTouch_Search: 4,//触碰到左上角的搜索 搜索右下角四个像素
	LeftBottomEdgeTouch_Search: 5,//触碰到左下角的搜索 搜索右上角四个像素
};

function isskylinepixel(pixels, index) {
	return pixels[index] == 255 && pixels[index + 1] == 0 && pixels[index + 2] == 0 && pixels[index + 3] == 255;
}

function getdirection(index, searchtype) {
	index /= 4;
	switch (searchtype) {
		case SearchType_Enum.Ordinary_Search:
			switch (index) {
				case 0:
					return 8;//左下方向
					break;
				case 1:
					return 4;//下
					break;
				case 2:
					return 6;//右下
					break;
				case 3:
					return 2;//左
					break;
				case 4:
					return 9;//自己
					break;
				case 5:
					return 1;//右
					break;
				case 6:
					return 7;//左上
					break;
				case 7:
					return 3;//上
					break;
				case 8:
					return 5;//右上
					break;
				default:
					return -1;
					break;
			}
			break;
		case SearchType_Enum.LeftEdgeTouch_Search:
			switch (index) {
				case 0: {
					return 4;
					break;
				}
				case 1: {
					return 6;
					break;
				}
				case 2: {
					return 9;
					break;
				}
				case 3: {
					return 1;
					break;
				}
				case 4: {
					return 3;
					break;
				}
				case 5: {
					return 5;
					break;
				}
				default: {
					return -1;
					break;
				}
			}
			break;
		case SearchType_Enum.TopEdgeTouch_Search:
			switch (index) {
				case 0: {
					return 2;
					break;
				}
				case 1: {
					return 9;
					break;
				}
				case 2: {
					return 1;
					break;
				}
				case 3: {
					return 7;
					break;
				}
				case 4: {
					return 3;
					break;
				}
				case 5: {
					return 5;
					break;
				}
				default: {
					return -1;
					break;
				}
			}
			break;
		case SearchType_Enum.BottomEdgeTouch_Search:
			switch (index) {
				case 0: {
					return 8;
					break;
				}
				case 1: {
					return 4;
					break;
				}
				case 2: {
					return 6;
					break;
				}
				case 3: {
					return 2;
					break;
				}
				case 4: {
					return 9;
					break;
				}
				case 5: {
					return 1;
					break;
				}
				default: {
					return -1;
					break;
				}
			}
			break;
		case SearchType_Enum.LeftTopEdgeTouch_Search:
			switch (index) {
				case 0: {
					return 4;
					break;
				}
				case 1: {
					return 6;
					break;
				}
				case 2: {
					return 9;
					break;
				}
				case 3: {
					return 1;
					break;
				}
				default: {
					return -1;
					break;
				}
			}
			break;
		case SearchType_Enum.LeftBottomEdgeTouch_Search:
			switch (index) {
				case 0: {
					return 9;
					break;
				}
				case 1: {
					return 1;
					break;
				}
				case 2: {
					return 3;
					break;
				}
				case 3: {
					return 5;
					break;
				}
				default: {
					return -1;
					break;
				}
			}
			break;
		default:
			return -1;
			break;
	}
}

function getimportant(index, searchtype) {
	index /= 4;
	switch (searchtype) {
		case SearchType_Enum.Ordinary_Search:
			if (index == 7 || index == 5 || index == 3 || index == 1) return 2;
			else if (index == 6 || index == 8 || index == 0 || index == 2) return 1;
			else return 0;
			break;
		case SearchType_Enum.LeftEdgeTouch_Search:
			if (index == 0 || index == 3 || index == 4) return 2;
			else if (index == 5 || index == 1) return 1;
			else return 0;
			break;
		case SearchType_Enum.TopEdgeTouch_Search:
			if (index == 0 || index == 2 || index == 4) return 2;
			else if (index == 5 || index == 3) return 1;
			else return 0;
			break;
		case SearchType_Enum.BottomEdgeTouch_Search:
			if (index == 3 || index == 1 || index == 5) return 2;
			else if (index == 0 || index == 2) return 1;
			else return 0;
			break;
		case SearchType_Enum.LeftTopEdgeTouch_Search:
			if (index == 0 || index == 3) return 2;
			else if (index == 1) return 1;
			else return 0;
			break;
		case SearchType_Enum.LeftBottomEdgeTouch_Search:
			if (index == 2 || index == 1) return 2;
			else if (index == 3) return 1;
			else return 0;
			break;
		default:
			return 0;
	}
}

function getpixels(searchtype, centerx, centery, stage, viewer, canvaswidth, canvasheight) {
	switch (searchtype) {
		case SearchType_Enum.BottomEdgeTouch_Search:
			if ((centerx + 2) <= canvaswidth && (centerx - 1) >= 0 && (centery + 2) <= canvasheight && centery >= 0) {
				return viewer.scene._context.readPixels({
					x: centerx - 1,
					y: centery,
					width: 3,
					height: 2,
					framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
				});
			}
			else {
				return null;
			}
			break;
		case SearchType_Enum.TopEdgeTouch_Search:
			if ((centerx + 2) <= canvaswidth && (centerx - 1) >= 0 && (centery + 1) <= canvasheight && (centery - 1) >= 0) {
				return viewer.scene._context.readPixels({
					x: centerx - 1,
					y: centery - 1,
					width: 3,
					height: 2,
					framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
				});
			}
			else {
				return null;
			}
			break;
		case SearchType_Enum.LeftBottomEdgeTouch_Search:
			if ((centerx + 2) <= canvaswidth && (centerx) >= 0 && (centery + 2) <= canvasheight && (centery) >= 0) {
				return viewer.scene._context.readPixels({
					x: centerx,
					y: centery,
					width: 2,
					height: 2,
					framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
				});
			}
			else {
				return null;
			}
			break;
		case SearchType_Enum.LeftTopEdgeTouch_Search:
			if ((centerx + 2) <= canvaswidth && (centerx) >= 0 && (centery + 1) <= canvasheight && (centery - 1) >= 0) {
				return viewer.scene._context.readPixels({
					x: centerx,
					y: centery - 1,
					width: 2,
					height: 2,
					framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
				});
			}
			else {
				return null;
			}
			break;
		case SearchType_Enum.LeftEdgeTouch_Search:
			if ((centerx + 2) <= canvaswidth && (centerx) >= 0 && (centery + 2) <= canvasheight && (centery - 1) >= 0) {
				return viewer.scene._context.readPixels({
					x: centerx,
					y: centery - 1,
					width: 2,
					height: 3,
					framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
				});
			}
			else {
				return null;
			}
			break;
		case SearchType_Enum.Ordinary_Search:
			if ((centerx + 2) <= canvaswidth && (centerx - 1) >= 0 && (centery + 2) <= canvasheight && (centery - 1) >= 0) {
				return viewer.scene._context.readPixels({
					x: centerx - 1,
					y: centery - 1,
					width: 3,
					height: 3,
					framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
				});
			}
			else {
				return null;
			}
			break;
		default:
			return null;
			break;
	}
}

function getaddxy(index, searchtype) {
	index /= 4;
	switch (searchtype) {
		case SearchType_Enum.LeftEdgeTouch_Search:
		case SearchType_Enum.LeftTopEdgeTouch_Search:
		case SearchType_Enum.LeftBottomEdgeTouch_Search:
			return {
				addx: index % 2,
				addy: parseInt(index / 2)
			}
			break;
		case SearchType_Enum.TopEdgeTouch_Search:
		case SearchType_Enum.BottomEdgeTouch_Search:
		case SearchType_Enum.Ordinary_Search:
			return {
				addx: index % 3,
				addy: parseInt(index / 3)
			}
			break;
		default:
			return null;
			break;
	}
}

function resortpixels(pixels, searchtype) {
	if (pixels == null) return null;
	let result = [];
	for (let i = 0; i < pixels.length / 4; i++) {
		let addxy = getaddxy(i * 4, searchtype);
		result.push({
			isskylinepixel: isskylinepixel(pixels, i * 4),
			addx: addxy.addx,
			addy: addxy.addy,
			important: getimportant(i * 4, searchtype),
			lastdirection: getdirection(i * 4, searchtype)
		})
	}
	result = result.sort(function (x, y) {
		return y.important - x.important;
	})
	return result;
}

function getcursearchtype(curwindowx, curwindowy, canvasheight) {
	if (curwindowx == 0) {
		if (curwindowy == canvasheight - 1) {
			return SearchType_Enum.LeftTopEdgeTouch_Search;
		}
		else if (curwindowy == 0) {
			return SearchType_Enum.LeftBottomEdgeTouch_Search;
		}
		else {
			return SearchType_Enum.LeftEdgeTouch_Search;
		}
	}
	else {
		if (curwindowy == canvasheight - 1) {
			return SearchType_Enum.TopEdgeTouch_Search;
		}
		else if (curwindowy == 0) {
			return SearchType_Enum.BottomEdgeTouch_Search;
		}
		else {
			return SearchType_Enum.Ordinary_Search;
		}
	}
}

function GetCurrentSkylineData(stagename, webglcontainerid) {
    let viewer = GlobalState.getInstance().viewer;
	let canvasheight = viewer.canvas.height;
	let canvaswidth = viewer.canvas.width;
    console.log(viewer.scene.postProcessStages);
	let stage = viewer.scene.postProcessStages._activeStages.find(item => item.name == stagename);
	let result = [];
	let errorresult = [];
	if (stage == null) {
		return [];
	}
	//开始计算
	//第一步：读取第一列从下往上找到对应像素位置
	var pixels = viewer.scene._context.readPixels({
		x: 0,
		y: 0,
		width: 1,
		height: canvasheight,
		// framebuffer:this.viewer.scene._view.pickFramebuffer._fb
		//   framebuffer : this.viewer.scene._view.pickDepths[0]._framebuffer
		//framebuffer : this.viewer.scene._view.sceneFramebuffer._framebuffer
		framebuffer: stage._textureCache._framebuffers[2].buffer._framebuffer
	});
	let findy = -1;
	let i = 0;
	for (; i < pixels.length; i += 4) {
		if (isskylinepixel(pixels, i)) {
			findy = i / 4;
			if (result.length > 0) {
				if (findy - result[result.length - 1].windowy > 1) {
					break;//中间如果有断开的则直接忽略
				}
			}
			result.push({
				windowx: 0,
				windowy: findy,
				direction: 3,//1:向右，2：向左，3：向上，4：向下，5：向右上方，6：向右下方，7：向左上方，8：向左下方，9：原本自己
			})
		}   
		else {
			if (result.length > 0) {
				break;
			}
		}
	}
	if (result.length > 0) {
		let find = true;
		let resortobj = {};
		let searchtype = SearchType_Enum.Ordinary_Search;
		while (result[result.length - 1].windowx < canvaswidth - 1 && find == true) {
			searchtype = getcursearchtype(result[result.length - 1].windowx, result[result.length - 1].windowy, canvasheight);
			let curwindowx = ((searchtype == SearchType_Enum.Ordinary_Search || searchtype == SearchType_Enum.TopEdgeTouch_Search || searchtype == SearchType_Enum.BottomEdgeTouch_Search) ?
				(result[result.length - 1].windowx - 1) :
				(result[result.length - 1].windowx));
			let curwindowy = ((searchtype == SearchType_Enum.LeftBottomEdgeTouch_Search || searchtype == SearchType_Enum.BottomEdgeTouch_Search) ?
				(result[result.length - 1].windowy - 1) :
				(result[result.length - 1].windowy - 1));
			pixels = getpixels(searchtype, result[result.length - 1].windowx, result[result.length - 1].windowy, stage, viewer, canvaswidth, canvasheight);
			i = 0;
			find = false;
			if (pixels == null) {
				continue;
			}
			resortobj = resortpixels(pixels, searchtype);
			for (; i < resortobj.length; i++) {
				if (resortobj[i].isskylinepixel == true) {
					let newwindowx = curwindowx + resortobj[i].addx;
					let newwindowy = curwindowy + resortobj[i].addy;
					if (result.filter(item => item.windowx == newwindowx && item.windowy == newwindowy).length > 0 || errorresult.filter(item => item.windowx == newwindowx && item.windowy == newwindowy).length > 0) {
						continue;
					}
					else {
						if (find == true) {
							result[result.length - 1].beiyong.push({
								windowx: newwindowx,
								windowy: newwindowy,
								lastdirection: resortobj[i].lastdirection
							})
						}
						else {
							result[result.length - 1].direction = resortobj[i].lastdirection;
							result.push({
								windowx: newwindowx,
								windowy: newwindowy,
								beiyong: [],
							})
							find = true;
						}
					}
				}
			}
			if (find == false) {
				switch (searchtype) {
					case SearchType_Enum.Ordinary_Search:
						//普通9邻域搜索情况下，如果始终没有找到的话，就回头pop一个从另一个路径继续寻找
						while (result.length > 2 && result[result.length - 1].beiyong.length == 0) {
							result.pop();
						}
						if (result.length > 2 && result[result.length - 1].beiyong.length > 0) {
							result[result.length - 2].direction = result[result.length - 1].beiyong[0].lastdirection;
							result.push({
								windowx: result[result.length - 1].beiyong[0].windowx,
								windowy: result[result.length - 1].beiyong[0].windowy,
								beiyong: result[result.length - 1].beiyong
							});
							result[result.length - 1].beiyong.splice(0, 1);
							errorresult.push({
								windowx: result[result.length - 2].windowx,
								windowy: result[result.length - 2].windowy
							})
							result.splice(result.length - 2, 1);
							find = true;
						}
						break;
					case SearchType_Enum.TopEdgeTouch_Search:
					//搜索到上边界或左上角，则贴着上边界往右搜索
					case SearchType_Enum.LeftTopEdgeTouch_Search:
					// result[result.length-1].direction=1;
					// result.push({
					//     windowx:result[result.length-1].windowx+1,
					//     windowy:result[result.length-1].windowy,
					//     beiyong:[]
					// })
					// find=true;
					// break;
					case SearchType_Enum.BottomEdgeTouch_Search:
					//搜索到下边界或左下角，则贴着下边界往右搜索
					case SearchType_Enum.LeftBottomEdgeTouch_Search:
						result[result.length - 1].direction = 1;
						result.push({
							windowx: result[result.length - 1].windowx + 1,
							windowy: result[result.length - 1].windowy,
							beiyong: []
						})
						find = true;
						break;
					case SearchType_Enum.LeftEdgeTouch_Search:
						//搜索到左边界，则贴着左边界往上搜索
						result[result.length - 1].direction = 3;
						result.push({
							windowx: result[result.length - 1].windowx,
							windowy: result[result.length - 1].windowy + 1,
							beiyong: []
						})
						find = true;
						break;
					default:
						break;
				}
			}
		}
	}
	return {
		data: result,
		width: canvaswidth,
		height: canvasheight
	};
}

export default {
	GetCurrentSkylineData
}
