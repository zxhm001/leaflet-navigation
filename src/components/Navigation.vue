<template>
    <div class="root-container">
        <div id="l_map" v-bind:style="{transform: 'rotate('+rotate+'deg)'}"></div>
        <mt-popup :modal="false" class="info-popup" position="top" v-model="infoPopupVisible">
            <img :src="instructionImage" class="info-img" />
            <div class="info-texts">
                <h4>{{navigationInfo1}}</h4>
                <h4>{{navigationInfo2}}</h4>
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
import { parseParams, createTimeString, createDistanceString, Projetction } from '../utils/utils';
import axios from 'axios';
export default {
    name: 'Navigation',
    data() {
        return {
            infoPopupVisible: true,
            opionPopupVisible: true,
            map: null,
            _rotate: 0,
            deviceorientation: 0,
            route: null,
            instructionIndex: 0,
            routeLayer: null,
            locationLayer: null,
            remainingRoute: null,
            locationEventObject: null,
            deviceorientationEventHandle: null
        };
    },
    mounted() {
        this.initMap();
        this.initRoute();
        this.setLocationEvent();
        this.setDeviceorientationEvent();
    },
    methods: {
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
        initRoute() {
            this.route = this.$store.getters.getRoute;
            this.remainingRoute = this.route;
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
        handleExitNavigation() {
            this.$router.push('/');
        },
        setLocationEvent() {
            let _this = this;
            this.locationEventObject = {
                locationfound: function(event) {
                    _this.locationLayer.clearLayers();
                    let navgationIcon = L.icon({
                        iconUrl: require('../assets/navigation.png'),
                        iconSize: [32, 32]
                    });
                    L.marker(event.latlng,{
                        icon:navgationIcon,
                        rotationAngle:_this.deviceorientation,
                        rotationOrigin:'center'
                        }).addTo(_this.locationLayer);
                }
            };
            this.map.on(this.locationEventObject);
            this.map.locate({
                watch:true,
                setView:true,
            });
        },
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
            };
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('ondeviceorientationabsolute', this.deviceorientationEventHandle);
            } else if ('ondeviceorientation' in window) {
                window.addEventListener('ondeviceorientation', this.deviceorientationEventHandle);
            }
        }
    },
    computed: {
        rotate: {
            get: function() {
                return this._rotate;
            },
            set: function(value) {
                L.Draggable._rotate = value;
                this._rotate = value;
            }
        },
        remaining() {
            if (this.remainingRoute != null) {
                let distanceStr = createDistanceString(this.remainingRoute.distance);
                let timeStr = createTimeString(this.remainingRoute.time);
                return distanceStr + '，约' + timeStr;
            }
            return '';
        },
        instructionImage() {
            let imageName = 'marker-icon-green';
            if (this.route != null) {
                switch (this.route.instructions[this.instructionIndex].sign) {
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
            return require('../assets/' + imageName + '.png');
        },
        navigationInfo1() {
            return '沿珞珈山路';
        },
        navigationInfo2() {
            return '继续直行800米';
        }
    },
    beforeDestroy() {
        this.rotate = 0;
        this.map.stopLocate();
        this.map.off(this.locationEventObject);
        if ('ondeviceorientationabsolute' in window) {
            window.removeEventListener('ondeviceorientationabsolute', this.deviceorientationEventHandle);
        } else if ('ondeviceorientation' in window) {
            window.removeEventListener('ondeviceorientation', this.deviceorientationEventHandle);
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
    margin-top: 2.5vh;
    margin-left: 4vw;
}
.info-texts {
    text-align: left;
    margin-left: 4vw;
}
</style>
