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
    init: function (route) {
        this._instructions = route.instructions;
        this._points = route.points.coordinates;
        this._distance = route.distance;
        this._instrctionIndex = 0;
        return this;
    },
    index() {
        return this._instructionIndex;
    },
    //当前导航的点
    instructionPoints() {
        let instruction = this._instructions[this._instructionIndex];
        return this._points.slice(instruction.interval[0], instruction.interval[1])
    },
    //在线路上的当前点
    currentPoint() {
        let instructionPoints = this.instructionPoints();
        return Helper.userSnappedToRoutePosition(this._location, instructionPoints);
    },
    instructionStrings() {
        let strings = ['',''];
        if (this._location != null) {
            let distance = this.stepDistanceRemaing();
            if (distance >= 50) {
                strings[0] = "沿" + this._instructions[this._instructionIndex].street_name;
                strings[1] = "继续步行" + Helper.createDistanceString(distance);
            }
            else
            {
                strings[0] = "前方" + Helper.createDistanceString(distance);
                strings[1] = this.this._instructions[this._instructionIndex].text;
            }
        }
        return strings;
    },
    stepDistanceRemaing() {
        let line = turf.lineString(this.instructionPoints());
        let cpoint = this.currentPoint();
        let startPoint = turf.point([cpoint.lng, cpoint.lat]);
        let endPoint = turf.point(line.geometry.coordinates[line.geometry.coordinates.length - 1]);
        let slice = turf.lineSlice(startPoint, endPoint, line);
        let length = turf.length(slice, { units: 'meters' });
        return length;
    },
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
    update(location) {
        this._location = location;
        if (this.stepDistanceRemaing() < 5) {
            if (this._instructionIndex < this._instructions.length - 1) {
                this._instructionIndex++;
            }
            else {

            }
        }
    }
}

export { NavigationProcess }; 