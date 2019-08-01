<template>
    <div class="root-container">
        <div id="l_map" v-bind:style="{transform: 'rotate('+rotate+'deg)'}"></div>
        <mt-popup :modal="false" class="info-popup" position="top" v-model="infoPopupVisible">
            <img :src="instructionImage" class="info-img" />
            <div class="info-texts">
                <h4>{{navigationInfo[0]}}</h4>
                <h4>{{navigationInfo[1]}}</h4>
            </div>
        </mt-popup>
        <mt-popup :modal="false" class="option-popup" position="bottom" v-model="opionPopupVisible">
            <div class="option">
                <h4>剩余{{remaining}}</h4>
                <mt-button @click="handleExitNavigation" size="small" type="danger">退出导航</mt-button>
            </div>
        </mt-popup>
    </div>
</template>

<script>
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import 'leaflet.locatecontrol';
import 'leaflet.chinatmsproviders';
import 'leaflet-rotatedmarker';
import '../plugins/RotateDraggable';
import * as turf from '@turf/turf';
import { parseParams, Projetction } from '../utils/utils';
import { NavigationProcess } from '../navigation/process';
import { locationToRouteDistance, createTimeString, createDistanceString } from '../navigation/helper';
import { Toast } from 'mint-ui';
// import {userSnappedToRoutePosition} from '../utils/navigation'
import axios from 'axios';
export default {
    name: 'Navigation',
    data() {
        return {
            infoPopupVisible: true,
            opionPopupVisible: true,
            map: null,
            p_rotate: 0,
            p_remaining: '',
            p_instructionImage: '',
            p_navigationInfo: ['', ''],
            deviceorientation: 0,
            currentLocation: null,
            route: null,
            routeLayer: null,
            locationLayer: null,
            locationEventObject: null,
            deviceorientationEventHandle: null,
            process: null
        };
    },
    mounted() {
        this.initMap();
        this.initRoute();
        this.startNavigation();
    },
    methods: {
        //初始化地图
        initMap() {
            let vec_c_Layer = L.tileLayer.chinaProvider('TianDiTu.Normal.Map', { maxZoom: 18, minZoom: 0 });
            let cva_c_layer = L.tileLayer.chinaProvider('TianDiTu.Normal.Annotion', { maxZoom: 18, minZoom: 0 });
            let vec_layer = L.layerGroup([vec_c_Layer, cva_c_layer]);
            this.map = L.map('l_map', {
                crs: L.CRS.EPSG3857,
                center: [30.6, 114.3],
                zoom: 10,
                layers: [vec_layer],
                zoomControl: false,
                attributionControl: false
            });
        },
        //初始化路径
        initRoute() {
            this.route = this.$store.getters.getRoute;
            this.routeLayer = L.geoJson().addTo(this.map);
            let defaultRouteStyle = { color: '#00cc33', weight: 8, opacity: 0.6 };
            let geojsonFeature = {
                type: 'Feature',
                geometry: this.route.points,
                properties: {
                    style: defaultRouteStyle,
                    name: 'route',
                    snapped_waypoints: this.route.snapped_waypoints
                }
            };
            this.routeLayer.addData(geojsonFeature);
            this.locationLayer = L.layerGroup([]);
            this.map.addLayer(this.locationLayer);
        },
        //开始导航
        startNavigation() {
            this.process = NavigationProcess.init(this.route);
            this.setLocationEvent();
            this.setDeviceorientationEvent(); 
        },
        //处理退出导航按钮点击事件
        handleExitNavigation() {
            this.$router.push('/');
        },
        //设置位置变化响应事件
        setLocationEvent() {
            let _this = this;
            this.locationEventObject = {
                locationfound: function(event) {
                    _this.currentLocation = event.latlng;
                    if (_this.process != null) {
                        _this.process.update(event.latlng);
                        _this.remaining = '';
                        _this.navigationInfo = ['', ''];
                        _this.instructionImage = '';
                        let tinyIndex = _this.process.tinyIndex();
                        let start = turf.point(_this.process.instructionPoints()[tinyIndex]);
                        let stop = turf.point(_this.process.instructionPoints()[tinyIndex+1]);
                        _this.rotate = 360 - turf.bearing(start,stop,{final:true});
                        if (_this.process.isComplete()) {
                            _this.map.stopLocate();
                            _this.map.off(_this.locationEventObject);
                            setTimeout(function(){
                                _this.$router.push('/');
                            },5000);
                        }
                    }
                    _this.refreshLocationMarker();
                }
            };
            this.map.on(this.locationEventObject);
            this.map.locate({
                watch: true,
                setView: true,
                enableHighAccuracy: true
            });
        },
        //设置角度变化响应事件
        setDeviceorientationEvent() {
            let _this = this;
            this.deviceorientationEventHandle = function(e) {
                if (e.webkitCompassHeading) {
                    // iOS
                    _this.deviceorientation = e.webkitCompassHeading;
                } else if (e.absolute && e.alpha) {
                    // Android
                    _this.deviceorientation = 360 - e.alpha;
                }
                _this.refreshLocationMarker();
            };
            if ('ondeviceorientationabsolute' in window) {
                L.DomEvent.on(window, 'deviceorientationabsolute', this.deviceorientationEventHandle, this);
            } else if ('ondeviceorientation' in window) {
                L.DomEvent.on(window, 'deviceorientation', this.deviceorientationEventHandle, this);
            }
        },
        //位置或角度变化时刷新位置图标
        refreshLocationMarker() {
            this.locationLayer.clearLayers();
            let navgationIcon = L.icon({
                iconUrl: require('../assets/navigation.png'),
                iconSize: [32, 32]
            });
            let point = this.currentLocation;
            let snapPoint = this.process.currentPoint();
            if (this.process.isOnRoute()) {
                point = snapPoint;
            } else {
                let latlngs = [[this.currentLocation.lat, this.currentLocation.lng], [snapPoint.lat, snapPoint.lng]];
                let polyline = L.polyline(latlngs, { color: 'grey' }).addTo(this.locationLayer);
            }
            L.marker(point, {
                icon: navgationIcon,
                rotationAngle: this.deviceorientation,
                rotationOrigin: 'center'
            }).addTo(this.locationLayer);
        }
    },
    computed: {
        rotate: {
            get: function() {
                return this.p_rotate;
            },
            set: function(value) {
                // L.Draggable.setRotate(value);
                this.map.dragging._draggable.setRotate(value);
                this.p_rotate = value;
            }
        },
        remaining: {
            get: function() {
                return this.p_remaining;
            },
            set: function() {
                if (this.process != null) {
                    let distance = this.process.distanceRemaining();
                    let time = (this.route.time * distance) / this.route.distance;
                    let distanceStr = createDistanceString(distance);
                    let timeStr = createTimeString(time);
                    this.p_remaining = distanceStr + '，约' + timeStr;
                }
            }
        },
        instructionImage: {
            get: function() {
                return this.p_instructionImage;
            },
            set: function() {
                let imageName = 'marker-icon-green';
                if (this.route != null) {
                    switch (this.route.instructions[this.process.index()].sign) {
                        case -98:
                            imageName = 'u_turn';
                            break;
                        case -8:
                            imageName = 'u_turn_left';
                            break;
                        case -7:
                            imageName = 'keep_left';
                            break;
                        case -3:
                            imageName = 'sharp_left';
                            break;
                        case -2:
                            imageName = 'sharp_left';
                            break;
                        case -1:
                            imageName = 'slight_left';
                            break;
                        case 0:
                            imageName = 'continue';
                            break;
                        case 1:
                            imageName = 'slight_right';
                            break;
                        case 2:
                            imageName = 'right';
                            break;
                        case 3:
                            imageName = 'sharp_right';
                            break;
                        case 4:
                            imageName = 'marker-icon-red';
                            break;
                        case 5:
                            imageName = 'marker-icon-blue';
                            break;
                        case 6:
                            imageName = 'roundabout';
                            break;
                        case 7:
                            imageName = 'keep_right';
                            break;
                        case 8:
                            imageName = 'u_turn_right';
                            break;
                        case 101:
                            imageName = 'pt_start_trip';
                            break;
                        case 102:
                            imageName = 'pt_transfer_to';
                            break;
                        case 103:
                            imageName = 'pt_end_trip';
                            break;
                        default:
                            break;
                    }
                }
                this.p_instructionImage = require('../assets/' + imageName + '.png');
            }
        },
        navigationInfo: {
            get: function() {
                return this.p_navigationInfo;
            },
            set: function() {
                if (this.process != null) {
                    let strings = this.process.instructionStrings();
                    if (strings[1]!=this.p_navigationInfo[1]) {
                        try {
                            var msg = new SpeechSynthesisUtterance(strings[0] + ',' + strings[1]);
                            window.speechSynthesis.speak(msg);
                        } catch (error) {
                        }
                    }
                    this.p_navigationInfo = strings;
                }
            }
        }
    },
    beforeDestroy() {
        this.rotate = 0;
        this.map.stopLocate();
        this.map.off(this.locationEventObject);
        if ('ondeviceorientationabsolute' in window) {
            L.DomEvent.off(window, 'deviceorientationabsolute', this.deviceorientationEventHandle, this);
        } else if ('ondeviceorientation' in window) {
            L.DomEvent.off(window, 'deviceorientation', this.deviceorientationEventHandle, this);
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#l_map {
    position: fixed;
    top: -50vh;
    bottom: -50vh;
    left: -50vw;
    right: -50vw;
}
.info-popup {
    width: 100%;
    height: 15vh;
    display: flex;
}
.option-popup {
    width: 100%;
    height: 50px;
}

.option {
    padding: 10px;
}

.option .mint-button {
    display: inline;
    margin-left: 30px;
}

.option h4 {
    display: inline;
}

.info-img {
    height: 10vh;
    max-width: 10vh;
    margin-top: 2.5vh;
    margin-left: 4vw;
}
.info-texts {
    text-align: left;
    margin-left: 4vw;
}
</style>
