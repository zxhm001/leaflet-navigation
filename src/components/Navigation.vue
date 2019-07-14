<template>
    <div class="root-container">
        <div id="l_map" v-bind:style="{transform: 'rotate('+rotate+'deg)'}"></div>
        <mt-popup :modal="false" class="info-popup" position="top" v-model="infoPopupVisible"></mt-popup>
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
import '../plugins/RotateDraggable';
import { parseParams, createTimeString, createDistanceString } from '../utils/utils';
import axios from 'axios';
export default {
    name: 'Navigation',
    data() {
        return {
            infoPopupVisible: true,
            opionPopupVisible: true,
            map: null,
            rotate: 0,
            route: 0,
            routeLayer: null,
            remainingRoute: null,
            locationEventObject: null
        };
    },
    mounted() {
        this.initMap();
        this.initRoute();
        this.setLocationEvent();
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
            var locationControl = L.control
                .locate({
                    position: 'bottomleft',
                    showCompass: true,
                    keepCurrentZoomLevel: true,
                    locateOptions: {
                        maxZoom: Infinity,
                        watch: true,
                        setView: true
                    }
                })
                .addTo(this.map);
            locationControl.start();
        },
        initRoute() {
            this.route = this.$store.getters.getRoute;
            this.remainingRoute = this.route;
            this.routeLayer = L.geoJson().addTo(this.map);
            let defaultRouteStyle = { color: '#00cc33', weight: 8, opacity: 0.6 };
            let firstPath = this.route.paths[0];
            let geojsonFeature = {
                type: 'Feature',
                geometry: firstPath.points,
                properties: {
                    style: defaultRouteStyle,
                    name: 'route',
                    snapped_waypoints: firstPath.snapped_waypoints
                }
            };
            this.routeLayer.addData(geojsonFeature);
        },
        handleExitNavigation() {
            this.$router.push('/');
        },
        setLocationEvent() {
            let _this = this;
            this.locationEventObject = {
                locationfound: function(event) {}
            };
            this.map.on(this.locationEventObject);
        }
    },
    computed: {
        remaining() {
            if (this.remainingRoute != null) {
                let path = this.remainingRoute.paths[0];
                let distanceStr = createDistanceString(path.distance);
                let timeStr = createTimeString(path.time);
                return distanceStr + '，时间' + timeStr;
            }
            return '';
        }
    },
    beforeDestroy() {
        this.map.off(this.locationEventObject);
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
</style>
