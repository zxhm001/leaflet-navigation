
import * as turf from "@turf/turf"

/***
 * 更好的floor函数
 * @param {Numbber} val 要floor的数字
 * @param {Numbber} precision 精度
 * @returns {Number} floor之后的数字
 */
const floorEx = function (val, precision) {
    if (!precision) precision = 1e6;
    return Math.floor(val * precision) / precision;
}

/*****
 * 更好的round函数
 * @param {Numbber} val 要round的数字
 * @param {Numbber} precision 精度
 * @returns {Number} round之后的数字
 */
const roundEx = function(val, precision) {
    if (precision === undefined) precision = 1e6;
    return Math.round(val * precision) / precision;
}

/************
 * 在路径上寻找定位位置最近的点
 * @param {LatLng} latlng 定位的位置坐标
 * @param {Array} coordinates 路径坐标
 * @returns {LatLng} 映射的位置
 */
const userSnappedToRoutePosition = function(latlng,coordinates){
    if (coordinates.length < 2) {
        return latlng;
    }
    let line = turf.lineString(coordinates);
    let pt = turf.point([latlng.lng, latlng.lat]);
    let snapped  = turf.nearestPointOnLine(line, pt, {units: 'meters'});
    return {lat:snapped.geometry.coordinates[1],lng:snapped.geometry.coordinates[0]}
}

/****
 * 计算定位位置到路径的距离
 * @param {LatLng} latlng 定位的位置坐标
 * @param {Array} 路径坐标
 * @returns {Number} 距离
 */
const locationToRouteDistance = function(latlng,coordinates){
    if (coordinates.length == 0) {
        return 0;
    }
    else if (coordinates.length == 1) {
        let pt1 = turf.point([latlng.lat, latlng.lng]);
        let pt2 = turf.point(coordinates[0]);
        let options = {units: 'meters'};
        return turf.distance(pt1,pt2,options);
    }

}

/******
 * 时间转换成字符串
 * @param {Number} time 时间，毫秒数
 * @returns {String} 时间字符串
 */
const createTimeString = function(time) {
    var tmpTime = roundEx(time / 60 / 1000, 1000);
    var resTimeStr;
    if (tmpTime > 60) {
        if (tmpTime / 60 > 24) {
            resTimeStr = floorEx(tmpTime / 60 / 24, 1) + "天";
            tmpTime = floorEx((tmpTime / 60) % 24, 1);
            if (tmpTime > 0) resTimeStr += " " + tmpTime + "小时";
        } else {
            resTimeStr = floorEx(tmpTime / 60, 1) + "小时";
            tmpTime = floorEx(tmpTime % 60, 1);
            if (tmpTime > 0) resTimeStr += " " + tmpTime + "分钟";
        }
    } else resTimeStr = roundEx(tmpTime % 60, 1) + "分钟";
    return resTimeStr;
}

/********
 * 距离转换成距离字符串
 * @param {Number} dist
 * @returns {String} 距离字符串
 */
const createDistanceString = function(dist) {
    if (dist < 900) {
        return roundEx(dist, 1) + "米";
    }

    dist = roundEx(dist / 1000, 100);
    if (dist > 100) {
        dist = roundEx(dist, 1);
    }
    return dist + "公里";
}


export {userSnappedToRoutePosition,locationToRouteDistance,createTimeString,createDistanceString}