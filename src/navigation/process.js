/******
 * 导航进程
 */
import * as Helper from './helper'
import * as turf from "@turf/turf"

const NavigationProcess = {
    _instructionIndex: 0,
    _instructions: [],
    _points: [],
    _location: null,
    _distance: 0,
    _complete: false,
    init: function (route) {
        this._instructions = route.instructions;
        this._points = route.points.coordinates;
        this._distance = route.distance;
        this._instrctionIndex = 0;
        return this;
    },
    /*********
     * 当前导航段顺序
     * @returns {Number} 当前导航段顺序
     */
    index() {
        return this._instructionIndex;
    },
    /******
     * 在当前导航段多个线段中的顺序
     * @returns {Number} 在当前导航段多个线段中的顺序
     */
    tinyIndex(){
        let index = 0;
        if (this._location != null) {
            let instructionPoints = this.instructionPoints();
            let currentPoint = this.currentPoint();
            let options = {units: 'meters'};
            if (instructionPoints.length <=2) {
                index = 0;
            }
            else{
                for (let i = 0; i < instructionPoints.length -1; i++) {
                    let start = instructionPoints[i];
                    let stop = instructionPoints[i + 1];
                    let line = turf.lineString([start, stop]);
                    let startLine = turf.lineString([start, [currentPoint.lng,currentPoint.lat]]);
                    let stopLine = turf.lineString([[currentPoint.lng,currentPoint.lat], stop]);
                    if (turf.length(startLine,options) + turf.length(stopLine,options) - turf.length(line,options) < 0.1) {
                        index = i;
                        break;
                    }
                }
            }
        }
        return index;
    },
    /*********
     * 当前导航段的点
     * @returns {Array} 当前导航段的点坐标穿[lng,lat]
     */
    instructionPoints() {
        let instruction = this._instructions[this._instructionIndex];
        return this._points.slice(instruction.interval[0], instruction.interval[1])
    },
    /*******
     * 当前位置在路径上的映射点
     * @returns {LatLng} 当前位置在路径上的映射点
     */
    currentPoint() {
        let instructionPoints = this.instructionPoints();
        return Helper.userSnappedToRoutePosition(this._location, instructionPoints);
    },
    /**********
     * 介绍语句
     * @returns {Array} 介绍语句，分为两段，分别在两行显示
     */
    instructionStrings() {
        let strings = ['', ''];
        if (this._location != null) {
            if (this.isComplete()) {
                strings[0] = '前方到达终点';
                strings[1] = '即将退出导航';
                return strings;
            }
            if (!this.isOnRoute()) {
                strings[0] = '您已偏离导航';
                strings[1] = '请回到导航线路上';
                return strings;
            }
            let distance = this.stepDistanceRemaing();
            if (distance >= 50) {
                let roadName = this._instructions[this._instructionIndex].street_name;
                if (roadName == null || roadName.length == 0) {
                    roadName = "无名路";
                }
                strings[0] = "沿" + roadName;
                strings[1] = "继续行进" + Helper.createDistanceString(distance);
            }
            else {
                strings[0] = "前方" + Helper.createDistanceString(distance);
                strings[1] = this._instructions[this._instructionIndex].text.replace('Keep left', '行进').replace('Keep right', '靠右行进');
            }
        }
        return strings;
    },
    /**********
     * 当前导航段剩余距离
     * @returns {Number} 当前导航段剩余距离
     */
    stepDistanceRemaing() {
        let line = turf.lineString(this.instructionPoints());
        let cpoint = this.currentPoint();
        let startPoint = turf.point([cpoint.lng, cpoint.lat]);
        let endPoint = turf.point(line.geometry.coordinates[line.geometry.coordinates.length - 1]);
        let slice = turf.lineSlice(startPoint, endPoint, line);
        let length = turf.length(slice, { units: 'meters' });
        return length;
    },
    /*********
     * 所有剩余距离
     * @returns {Number}所有剩余距离
     */
    distanceRemaining() {
        if (this._location != null) {
            let length = 0;
            for (let index = this._instructionIndex + 1; index < this._instructions.length; index++) {
                const element = this._instructions[index];
                length += element.distance;
            }
            length += this.stepDistanceRemaing();
            return length;
        }
        else {
            return this._distance;
        }

    },
    /*********
     * 是否在线路上
     * 距离线路20米被认为不在线路上
     * @returns {Boolean} 
     */
    isOnRoute() {
        let distance = Helper.locationToRouteDistance(this._location, this.instructionPoints());
        if (distance > 20) {
            return false;
        }
        else {
            return true;
        }
    },
    /**********
     * 是否完成导航
     * @returns {Boolean} 是否完成导航
     */
    isComplete() {
        return this._complete;
    },
    /***
     * 更新进度
     * @param {LatLng} location 定位信息
     * 
     */
    update(location) {
        this._location = location;
        if (this.stepDistanceRemaing() < 2) {
            if (this._instructionIndex < this._instructions.length - 1) {
                this._instructionIndex++;
            }
            else {
                this._complete = true;
            }
        }
    }
}

export { NavigationProcess }; 