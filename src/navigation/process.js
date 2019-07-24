/******
 * 导航进程
 */
import * as Helper from './helper'

const NavigationProcess = {
    _instructionIndex:0,
    _instructions:[],
    _points:[],
    _location:null,
    init:function(route){
        this._instrctions = route.instrctions;
        this._points = route.points.coordinates;
        this._instrctionIndex = 0;
        return this;
    },
    index(){
        return this._instructionIndex;
    },
    instructionPoints(){
        let instruction = this._instructions[this._instructionIndex];
        return this._points.slice(instruction.interval[0],instruction.interval[1])
    },
    currentPoint(){
        let instructionPoints = this.instructionPoints();
        return Helper.userSnappedToRoutePosition(this._points,instructionPoints);
    },
    instructionString(){

    },
    distanceRemaining(){

    },
    update(location){
        this._location = location;
    }
}

export {NavigationProcess}; 