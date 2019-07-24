
import * as turf from "@turf/turf"

/************
 * 在路径上寻找定位位置最近的点
 * @param {LatLng} latlng 定位的位置坐标
 * @param {Array} coordinates
 * @returns {LatLng} 银蛇
 */
const userSnappedToRoutePosition = function(latlng,coordinates){
    if (coordinates.length < 2) {
        return latlng;
    }
    let line = turf.lineString(coordinates);
    let pt = turf.point([latlng.lat, latlng.lng]);
    let snapped  = turf.nearestPointOnLine(line, pt, {units: 'meters'});
    return {lat:snapped.geometry.coordinates[1],lng:snapped.geometry.coordinates[0]}
}



export {userSnappedToRoutePosition}