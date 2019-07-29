<template>
    <div class="root-container">
        <div :class="{ 'search-searching': isSearching }" class="search">
            <div class="search-icon">
                <i aria-hidden="true" class="fa fa-search"></i>
            </div>
            <input @focus="handleSearchFocus" placeholder="搜索线路、景点、商家服务" type="text" />
        </div>
        <div id="l_map"></div>
        <mt-popup class="search-popup" position="bottom" v-model="searchPopupVisible">
            <div class="quick-search">
                <mt-button size="small" type="default">线路</mt-button>
                <mt-button size="small" type="default">景点</mt-button>
                <mt-button size="small" type="default">商家服务</mt-button>
                <mt-button size="small" type="default">方案</mt-button>
            </div>
            <hr />
            <div :key="searchResult.id" @click="handleResultSelect(searchResult)" v-for="searchResult in searchResults">
                <mt-cell :title="searchResult.name">
                    <img :src="getSearchResultIcon(searchResult.type)" height="24" slot="icon" width="24" />
                </mt-cell>
            </div>
        </mt-popup>
        <mt-popup :modal="false" class="info-popup" position="bottom" v-model="infoPopupVisible">
            <div class="describe-img">
                <img :alt="resultInfo.name" :src="resultInfo.imageurl" />
            </div>
            <div class="describe-text">
                <div class="describe-title">
                    <h4>
                        {{resultInfo.name}}
                        <mt-badge size="small">{{distance}}</mt-badge>
                    </h4>
                    <a @click="handleRouteBtnClick" id="route_btn">
                        <img src="../assets/route2.png" />
                    </a>
                </div>
                <p>{{resultInfo.description}}</p>
            </div>
        </mt-popup>
        <mt-popup :modal="false" class="route-popup" position="bottom" v-model="routePopupVisible">
            <h4>{{routeDescriptionString}}</h4>
            <hr />
            <div class="route-buttons">
                <mt-button @click="handleCancelNavigation" size="small" type="default">取消导航</mt-button>
                <mt-button @click="handleStartNavigation" size="small" type="primary">开始导航</mt-button>
            </div>
        </mt-popup>
    </div>
</template>

<script>
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.css';
import * as L from 'leaflet';
import 'leaflet.locatecontrol';
import 'leaflet.chinatmsproviders';
import { Indicator } from 'mint-ui';
import { Toast } from 'mint-ui';
import * as turf from "@turf/turf"
import { parseParams } from '../utils/utils';
import {createTimeString,createDistanceString} from '../navigation/helper'
import axios from 'axios';

export default {
    name: 'Map',
    data() {
        return {
            map: null,
            searchPopupVisible: false,
            infoPopupVisible: false,
            routePopupVisible: false,
            isSearching: false,
            currentLocation: null,
            trailLayers: [
                {
                    url: 'http://www.myshuju.me:8000/geoserver/map/wms',
                    layers: 'map:road'
                }
            ],
            searchResults: [
                { id: 0, type: '线路', name: '逐步环线' },
                { id: 1, type: '景点', name: '福泉寺' },
                { id: 2, type: '方案', name: '妙相寺到许家山' },
                { id: 3, type: '商服', name: '七天连锁酒店' },
                { id: 4, type: '线路', name: '龙宫生态沟环线' },
                { id: 5, type: '景点', name: '竹林' },
                { id: 6, type: '方案', name: '上金到马岙' },
                { id: 7, type: '商服', name: '逐步环线' },
                { id: 8, type: '商服', name: '走一走户外用品' }
            ],
            resultInfo: {
                id: 0,
                type: '景点',
                name: '福泉寺',
                description:
                    '宁海城西南有紧密相连的两座山——连头山和福泉山，统称连福山。山上有建于宋代的福泉寺和福佑庙，分别位于福泉山和莲头山。福泉寺内有五百罗汉堂。福佑庙后有富含氡的药泉，可治风湿病，传为“龙爪七洞井”分布其间的“龙泉”。',
                geometryid: '1',
                geometry: { type: 'Point', coordinates: [114.3402356, 30.5311278] },
                imageurl: require('../assets/福泉寺.jpg')
            },
            searchLayer: null,
            route: null,
            routeLayer: null,
            locationEventObject: null
        };
    },
    mounted() {
        this.initMap();
        this.addTrailLayers();
        this.bindMapEvent();
    },
    methods: {
        initMap() {
            let vec_c_Layer = L.tileLayer.chinaProvider('TianDiTu.Normal.Map', { maxZoom: 18, minZoom: 0 });
            let cva_c_layer = L.tileLayer.chinaProvider('TianDiTu.Normal.Annotion', { maxZoom: 18, minZoom: 0 });
            let img_c_Layer = L.tileLayer.chinaProvider('TianDiTu.Satellite.Map', { maxZoom: 18, minZoom: 0 });
            let cia_c_layer = L.tileLayer.chinaProvider('TianDiTu.Satellite.Annotion', { maxZoom: 18, minZoom: 0 });
            let vec_layer = L.layerGroup([vec_c_Layer, cva_c_layer]),
                img_layer = L.layerGroup([img_c_Layer, cia_c_layer]);
            this.map = L.map('l_map', {
                crs: L.CRS.EPSG3857,
                center: [30.6, 114.3],
                zoom: 10,
                layers: [vec_layer],
                zoomControl: false,
                attributionControl: false
            });
            let baseLayers = {
                电子地图: vec_layer,
                影像地图: img_layer
            };
            L.control.layers(baseLayers, null, { position: 'bottomright' }).addTo(this.map);
            let locationControl = L.control
                .locate({
                    position: 'bottomleft',
                    showCompass: true,
                    enableHighAccuracy:true
                })
                .addTo(this.map);
            locationControl.start();
            L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
            //加载业务图层
            let icon = L.icon({
                iconUrl: require('../assets/marker-icon-red.png'),
                iconAnchor: [0, 41]
            });
            this.searchLayer = L.geoJson(null, {
                pointToLayer: function(feature, latlng) {
                    let mark = L.marker(latlng, { icon: icon });
                    mark.feature = feature;
                    return mark;
                },
                style: function(feature) {
                    return { color: '#00FEFE' };
                }
            }).addTo(this.map);
            this.routeLayer = L.geoJson().addTo(this.map);
        },
        //添加步道
        addTrailLayers() {
            //TODO:根据定位选择步道之后会单个步道
            this.trailLayers.forEach(trailLayer => {
                L.tileLayer
                    .wms(trailLayer.url, {
                        layers: trailLayer.layers,
                        format: 'image/png',
                        transparent: true
                    })
                    .addTo(this.map);
            });
        },
        //绑定地图事件
        bindMapEvent() {
            let _this = this;
            this.map.on('click', function(event) {
                _this.infoPopupVisible = false;
                _this.searchLayer.clearLayers();
            });
            this.locationEventObject = {
                locationfound: function(event) {
                    _this.currentLocation = event.latlng;
                }
            };
            this.map.on(this.locationEventObject);
        },
        //处理开始搜索时的效果
        handleSearchFocus() {
            this.isSearching = true;
            this.searchPopupVisible = true;
            this.searchLayer.clearLayers();
            //TODO:监测input的输入事件，进行搜索
        },
        //处理选择的搜索结果
        handleResultSelect(result) {
            this.isSearching = false;
            this.searchPopupVisible = false;
            this.infoPopupVisible = true;
            //TODO:从接口获取实际的数据，以及获取数据之后根据geometryid获取地理数据
            this.searchLayer.addData(this.resultInfo.geometry);
            this.map.panTo(L.latLng(this.resultInfo.geometry.coordinates[1], this.resultInfo.geometry.coordinates[0]));
            //TODO:移动到地图需要完善其他几何类型
        },
        //获取搜索结果的图标
        getSearchResultIcon(type) {
            switch (type) {
                case '线路':
                    return require('../assets/route.png');
                case '景点':
                    return require('../assets/attraction.png');
                case '方案':
                    return require('../assets/plan.png');
                case '商服':
                    return require('../assets/business.png');
                default:
                    return require('../assets/position.png');
            }
        },
        //请求线路数据
        handleRouteBtnClick() {
            this.searchLayer.clearLayers();
            Indicator.open();
            this.infoPopupVisible = false;
            var toIcon = L.icon({
                iconUrl: require('../assets/marker-small-red.png')
            });
            let toPoint = L.latLng(this.resultInfo.geometry.coordinates[1], this.resultInfo.geometry.coordinates[0]);
            this.$store.commit('setToPoint', toPoint);
            L.marker(toPoint, { icon: toIcon }).addTo(this.routeLayer);

            let pointStr =
                'point=' +
                encodeURIComponent(this.currentLocation.lat + ',' + this.currentLocation.lng) +
                '&point=' +
                encodeURIComponent(toPoint.lat + ',' + toPoint.lng);
            let options = {
                type: 'json',
                locale: 'zh-CN',
                vehicle: 'foot',
                weighting: 'fastest',
                elevation: false,
                points_encoded: false
            };
            let url = this.$store.getters.getRouteUrl + '/route?' + pointStr + '&' + parseParams(options);
            axios
                .get(url)
                .then(res => {
                    Indicator.close();
                    if (res.status == 200) {
                        let data = res.data;
                        if (data.message) {
                            return;
                        }
                        this.route = data;
                        this.$store.commit('setRoute', data.paths[0]);
                        let defaultRouteStyle = { color: '#00cc33', weight: 8, opacity: 0.6 };
                        let firstPath = data.paths[0];
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

                        if (firstPath.bbox) {
                            let minLon = firstPath.bbox[0];
                            let minLat = firstPath.bbox[1];
                            let maxLon = firstPath.bbox[2];
                            let maxLat = firstPath.bbox[3];
                            let tmpB = new L.LatLngBounds(new L.LatLng(minLat, minLon), new L.LatLng(maxLat, maxLon));
                            this.map.fitBounds(tmpB);
                        }
                        this.routePopupVisible = true;
                    }
                })
                .catch(e => {
                    Indicator.close();
                    Toast(e);
                });
        },
        //取消导航
        handleCancelNavigation() {
            this.routeLayer.clearLayers();
            this.routePopupVisible = false;
        },
        //开始导航
        handleStartNavigation() {
            this.$router.push('/nav');
        }
    },
    computed: {
        distance() {
            if (this.currentLocation == null || this.resultInfo.geometry == null) {
                return '计算中';
            }
            let from = turf.point([this.currentLocation.lng, this.currentLocation.lat]);
            let to = turf.point([this.resultInfo.geometry.coordinates[0], this.resultInfo.geometry.coordinates[1]]);
            let options = {units: 'meters'};
            let d = turf.distance(from,to,options);
            return createDistanceString(d);
            //TODO:此处只计算了点类型地理要素，没有计算线类型的地理要素
        },
        routeDescriptionString() {
            if (this.route == null) {
                return '计算中';
            }
            if (this.route.paths.length == 0) {
                return '计算中';
            }
            let path = this.route.paths[0];
            let distanceStr = createDistanceString(path.distance);
            let timeStr = createTimeString(path.time);
            return distanceStr + '的路线，需要时间' + timeStr;
        }
    },
    beforeDestroy() {
        this.map.stopLocate();
        this.map.off(this.locationEventObject);
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.root-container {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.search {
    position: absolute;
    top: 4vh;
    width: calc(100% - 16vw);
    height: 40px;
    background-color: #fff;
    margin-left: 8vw;
    z-index: 3000;
}

.search-searching {
    top: 0 !important;
    width: 100% !important;
    margin-left: 0 !important;
}

.search .search-icon {
    margin: 10px 5px;
    padding: 5px 10px;
    text-align: center;
    line-height: 20px;
    border-right: 1px solid #ccc;
    display: inline;
}

.search .search-icon i {
    color: rgb(38, 153, 251);
    font-size: 20px;
}

.search input {
    border: none;
    width: calc(100% - 60px);
    height: 95%;
    font-size: 16px;
    display: inline;
}
.search input ::placeholder {
    color: #ccc;
    font-size: 14px;
}

#l_map {
    height: 100%;
    width: 100%;
}

.info-popup {
    width: 100%;
    height: 18vh;
    display: flex;
}
.search-popup {
    width: 100%;
    height: calc(100% - 45px);
    text-align: left;
}

.search-popup hr,
.route-popup hr {
    color: #ccc;
    opacity: 0.5;
}

.quick-search {
    margin: 10px auto;
    text-align: center;
}

.quick-search .mint-button {
    margin-right: 10px;
    border-radius: 0;
    background-color: #fcfcfc;
}

.mint-cell {
    background-image: -webkit-gradient(
        linear,
        left bottom,
        left top,
        from(#d9d9d9),
        color-stop(50%, #d9d9d9),
        color-stop(50%, transparent)
    );
    background-image: linear-gradient(0deg, #d9d9d9, #d9d9d9 50%, transparent 50%);
    background-size: 100% 1px;
    background-repeat: no-repeat;
    background-position: bottom;
}

.describe-img {
    flex: 0 0 41.666667%;
    max-width: 41.666667%;
    height: 100%;
    padding: 5px;
    text-align: center;
}
.describe-img img {
    max-width: calc(100% - 10px);
    max-height: calc(100% - 10px);
    position: relative;
    top: 50%;
    transform: translateY(-50%);
}

.describe-text {
    flex: 0 0 58.333333%;
    max-width: 58.333333%;
    text-align: left;
}

.describe-text h4,
.route-popup h4 {
    margin: 10px 0;
}

.describe-text p {
    font-size: 14px;
    margin: 4px 0;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
}

.describe-title {
    align-items: center;
    display: flex;
}

#route_btn {
    margin-left: auto;
    margin-right: 16px;
}

#route_btn img {
    width: 28px;
    height: 28px;
}

.route-popup {
    width: 100%;
    height: 15vh;
}

.route-buttons {
    text-align: right;
}

.route-buttons .mint-button {
    margin-right: 20px;
}
</style>
