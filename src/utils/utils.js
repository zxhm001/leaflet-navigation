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

export { getCenter, parseParams, calDistance,calBearing , Projetction };
