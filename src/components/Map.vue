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
            <hr>
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
                    <h4>{{resultInfo.name}}<mt-badge size="small">{{distance}}</mt-badge></h4>
                    <a id="route_btn" @click="handleRouteBtnClick"><img src="../assets/route2.png"></a>
                </div>
                <p>{{resultInfo.description}}</p>
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

export default {
    name: 'Map',
    data() {
        return {
            map: null,
            searchPopupVisible: false,
            infoPopupVisible: false,
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
                { id: 0, type: '景点', name: '福泉寺' },
                { id: 0, type: '方案', name: '妙相寺到许家山' },
                { id: 0, type: '商服', name: '七天连锁酒店' },
                { id: 0, type: '线路', name: '龙宫生态沟环线' },
                { id: 0, type: '景点', name: '竹林' },
                { id: 0, type: '方案', name: '上金到马岙' },
                { id: 0, type: '商服', name: '逐步环线' },
                { id: 0, type: '商服', name: '走一走户外用品' }
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
            }
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
            });
            this.map.on('locationfound ', function(event) {
                _this.currentLocation = event.latlng;
            });
        },
        //处理开始搜索时的效果
        handleSearchFocus() {
            this.isSearching = true;
            this.searchPopupVisible = true;
            //TODO:监测input的输入事件，进行搜索
        },
        //处理选择的搜索结果
        handleResultSelect(result) {
            this.isSearching = false;
            this.searchPopupVisible = false;
            this.infoPopupVisible = true;
            //TODO:从接口获取实际的数据，以及获取数据之后根据geometryid获取地理数据
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
        handleRouteBtnClick(){

        }
    },
    computed: {
        distance() {
            if (this.currentLocation == null || this.resultInfo.geometry == null) {
                return '计算中';
            }
            let dx = Math.abs((this.currentLocation.lng - this.resultInfo.geometry.coordinates[0])) * 110;
            let dy = Math.abs((this.currentLocation.lat - this.resultInfo.geometry.coordinates[1])) * 110;
            let d = Math.sqrt(dx * dx + dy * dy) / 2;
            return d.toFixed(2) + 'km';
            //TODO:此处只计算了点类型地理要素，没有计算线类型的地理要素，另110KM只是估算，精确计算需要投影到平面坐标系
        }
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

.search-popup hr{
    color: #ccc
}

.quick-search{
    margin:10px auto;
    text-align: center
}

.quick-search .mint-button{
    margin-right: 10px;
    border-radius:0;
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

.describe-text h4{
    margin: 10px 0;
}

.describe-text p {
    font-size: 14px;
    margin: 4px 0;
    text-overflow: ellipsis;
    overflow: hidden;
    display:-webkit-box; 
    -webkit-box-orient:vertical;
    -webkit-line-clamp:3; 
}

.describe-title{
    align-items: center;
    display: flex;
}

#route_btn{
    margin-left: auto;
    margin-right: 16px;
}

#route_btn img{
    width: 28px;
    height: 28px;
}
</style>
