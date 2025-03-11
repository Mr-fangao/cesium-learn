const Pi=3.1415926535897932384626;
function formatScale(val) {
    let format = -1;
    if(val>12){
        format = 400;
    }else if(val>10){
        format = 300;
    }else if(val>8){
        format = 200;
    }else if(val>6){
        format = 100;
    }else {
        format = 50;
    }
    return format;
}

function reviseX(screenX, zoom) {
    let fzoom = Math.round(zoom);
    let formatX=0;
    switch (fzoom) {
        case 8:
            formatX = 0.03*screenX;
            break;
        case 9:
            formatX = 0.04*screenX;
            break;
        case 10:
            formatX = 0.05*screenX;
            break;
        case 11:
            formatX = 0.06*screenX;
            break;
        case 12:
            formatX = 0.07*screenX;
            break;
        case 13:
            formatX = 0.08*screenX;
            break;
        default:
            break;
    }
    return formatX;
}

function reviseY(screenY, zoom) {
    let fzoom = Math.round(zoom);
    let formatY=0;
    switch (fzoom) {
        case 8:
            formatY = 0.03*screenY;
            break;
        case 9:
            formatY = 0.08*screenY;
            break;
        case 10:
            formatY = 0.18*screenY;
            break;
        case 11:
            formatY = 0.28*screenY;
            break;
        case 12:
            formatY = 0.35*screenY;
            break;
        case 13:
            formatY = 0.4*screenY;
            break;
        default:
            break;
    }
    return formatY;
}

/**
 * WGS84转墨卡托投影
 * @param lat
 * @param lon
 * @returns {{x: number, y: number}}
 */
function lonLatToMercator(lat,lon) {
    var pi = 3.1415926535897932384626;
    var x = lon * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lat) * pi / 360)) / (pi / 180);
    y = y * 20037508.34 / 180;
    return{
        Mercator_X:x,
        Mercator_Y:y
    }
}

//墨卡托转经纬度
function MercatorTolonLat(lat,lon) {
    var x = lon / 20037508.34 * 180;
    var y = lat / 20037508.34 * 180;
    y = 180 / Pi * (2 * Math.atan(Math.exp(y * Pi / 180)) - Pi / 2);

    return {
        Longitude:x,
        Latitude:y
    }
}







function GetPi() {
    return Pi;
}

/**
 * 距离计算通用方法
 * @param x1 起点横坐标
 * @param y1 起点纵坐标
 * @param x2 终点横坐标
 * @param y2 终点纵坐标
 * @param wkid 坐标系标识（默认投影坐标）
 * @returns {number}
 */
function calculateDistance(x1, y1, x2, y2, wkid) {
    let distance = 0;
    if(wkid == 4326){
       let first = lonLatToMercator(y1,x1);
       let second = lonLatToMercator(y2,x2);
        distance = Math.sqrt(Math.pow((first.Mercator_X-second.Mercator_X),2)+Math.pow((first.Mercator_Y-second.Mercator_Y),2));
    }else {
        distance = Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2));
    }
    return distance;
}

function formatGeom(geom) {
    let geostr;
    let geoArr = [];
    geostr = geom.substring(geom.lastIndexOf('(')+1, geom.indexOf(')')).trim();
    geostr = geostr.replace(/\ /g,",").replace(/\,,/g,",");
    let geoStrArr =  geostr.split(",");
    geoStrArr.forEach(value => {
        geoArr.push(parseFloat(value));
    })
    return geoArr;
}

//在数字num前面补齐padchar，使总位数为n
function PadLeft(num,padchar,n) {
    return (Array(n).join(padchar) + num).slice(-n)
}
//在数字num后面补齐padchar，使总位数为n
function PadRight(num,padchar,n) {
    return (num+Array(n).join(padchar)).slice(-n);
}

export default {
    formatScale,
    reviseX,
    reviseY,
    lonLatToMercator,
    MercatorTolonLat,
    formatGeom,
    GetPi,

    PadLeft,
    PadRight
}
