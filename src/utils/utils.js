/*******
 * 获取边界的中心
 * @param {LatLngBounds} bounds 边界
 * @returns {LatLng} 中心
 */
function getCenter(bounds) {
    var center = {
        lat: 0,
        lng: 0
    };
    if (bounds.initialized) {
        center.lat = (bounds.minLat + bounds.maxLat) / 2;
        center.lng = (bounds.minLon + bounds.maxLon) / 2;
    }
    return center;
}

/***
 * 更好的floor函数
 * @param {Numbber} val 要floor的数字
 * @param {Numbber} precision 精度
 * @returns {Number} floor之后的数字
 */
function floorEx(val, precision) {
    if (!precision) precision = 1e6;
    return Math.floor(val * precision) / precision;
}

/*****
 * 更好的round函数
 * @param {Numbber} val 要round的数字
 * @param {Numbber} precision 精度
 * @returns {Number} round之后的数字
 */
function roundEx(val, precision) {
    if (precision === undefined) precision = 1e6;
    return Math.round(val * precision) / precision;
}

/*******
 * js对象转换成url参数
 * @param {Object} data 要转换的参数
 * @returns {String} query格式字符串
 */
function parseParams(data) {
    try {
        var tempArr = [];
        for (var i in data) {
            var key = encodeURIComponent(i);
            var value = encodeURIComponent(data[i]);
            tempArr.push(key + "=" + value);
        }
        var urlParamsStr = tempArr.join("&");
        return urlParamsStr;
    } catch (err) {
        return "";
    }
}

/******
 * 时间转换成字符串
 * @param {Number} time 时间，毫秒数
 * @returns {String} 时间字符串
 */
function createTimeString(time) {
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

function createDistanceString(dist) {
    if (dist < 900) {
        return roundEx(dist, 1) + "米";
    }

    dist = roundEx(dist / 1000, 100);
    if (dist > 100) {
        dist = roundEx(dist, 1);
    }
    return dist + "公里";
}

export { getCenter, parseParams, createTimeString, createDistanceString };
