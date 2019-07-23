/*******
 * 获取边界的中心
 * @param {LatLngBounds} bounds 边界
 * @returns {LatLng} 中心
 */
const getCenter = function(bounds) {
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

/*******
 * js对象转换成url参数
 * @param {Object} data 要转换的参数
 * @returns {String} query格式字符串
 */
const parseParams = function(data) {
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

/*****
 * 地理坐标与平面坐标转换
 * 使用莫卡拓坐标系
 */
const Projetction = {
    /**********
     * 经纬度转换成莫卡托平面坐标系
     * @param {Number} lon 经度
     * @param {Number} lat 纬度
     * @returns 莫卡托平面坐标对象
     */
    lonLat2Mercator: function (lon, lat) {
        var earthRad = 6378137.0;
        let x = lon * Math.PI / 180 * earthRad;
        let a = lat * Math.PI / 180;
        let y = earthRad / 2 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
        return { x: x, y: y };
    },
    /**********
     * 莫卡托平面坐标系转经纬度
     * @param {Numbber} x 平面坐标X
     * @param {Numbber} y 平面坐标Y
     * @returns 经纬度对象
     */
    mercator2lonLat: function (x, y) {
        let lon = x / 20037508.34 * 180;
        let mmy = y / 20037508.34 * 180;
        let lat = 180 / Math.PI * (2 * Math.atan(Math.exp(mmy * Math.PI / 180)) - Math.PI / 2);

        return { lon: lon, lat, lat };
    }
}

export { getCenter, parseParams, createTimeString, createDistanceString, calDistance,calBearing , Projetction };
