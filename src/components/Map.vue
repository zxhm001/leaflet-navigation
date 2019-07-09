<template>
    <div class='root-container'>
        <div class='search' :class="{ 'search-searching': isSearching }" >
            <div class='search-icon'>
                <i class="fa fa-search" aria-hidden="true"></i>
            </div>
            <input placeholder='搜索线路、景点、商家服务' type='text' @focus="handleSearchFocus" @blur="handleSearchBlur" />
        </div>
        <div id='l_map'></div>
        <mt-popup class='search-popup' position='bottom' v-model='searchPopupVisible'></mt-popup>
        <mt-popup class='info-popup' position='bottom' :modal='false' v-model='infoPopupVisible'></mt-popup>
    </div>
</template>

<script>
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.css';
import * as L from 'leaflet';
import 'leaflet.locatecontrol';
import 'leaflet.chinatmsproviders';

export default {
    name: 'Map',
    data() {
        return {
            map: null,
            searchPopupVisible: false,
            infoPopupVisible: true,
            isSearching:false,
            trailLayers: [
                {
                    url: 'http://www.myshuju.me:8000/geoserver/map/wms',
                    layers: 'map:road'
                }
            ]
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
            this.map.addLayer(vec_layer);
            let baseLayers = {
                电子地图: vec_layer,
                影像地图: img_layer
            };
            L.control.layers(baseLayers, null, { position: 'bottomright' }).addTo(this.map);
            var locationControl = L.control
                .locate({
                    position: 'bottomleft',
                    showCompass: true
                })
                .addTo(this.map);
            locationControl.start();
            L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
        },
        addTrailLayers() {
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
        bindMapEvent(){
            let _this = this;
            this.map.on("click",function(event) {
               _this.infoPopupVisible = false; 
            });
        },
        handleSearchFocus(){
            this.isSearching = true;
            this.searchPopupVisible = true;
        },
        handleSearchBlur(){
            this.isSearching = false;
            this.searchPopupVisible = false;
        },
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.root-container {
    position:fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}

.search {
    position: absolute;
    top: 5vh;
    width: calc(100% - 16vw);
    height: 40px;
    background-color: #fff;
    margin-left: 8vw;
    z-index: 3000;
}

.search-searching{
    top: 0 !important;
    width: 100% !important;
    margin-left:0 !important;
}

.search .search-icon {
    margin: 10px 5px;
    padding: 5px 10px;
    text-align: center;
    line-height: 20px;
    border-right: 1px solid #ccc;
    display: inline;
}

.search .search-icon i{
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
.search input ::placeholder{
    color: #ccc;
    font-size: 14px;
}

#l_map {
    height: 100%;
    width: 100%;
}

.info-popup{
    width: 100%;
    height: 20vh;
}
.search-popup{
    width: 100%;
    height: calc(100% - 45px);
}
</style>
