import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);


const state = {
    route: null,
    toPoint: null,
    routeUrl: 'http://www.myshuju.me:8989',
};


const getters = {
    getRoute(state) {
        return state.route;
    },
    getToPoint(state)
    {
        return state.toPoint;
    },
    getRouteUrl(state){
        return state.routeUrl;
    }
};

const mutations = {
    setRoute(state,route){
        state.route = route;
    },
    setToPoint(state,point)
    {
        state.toPoint =point;
    }
}

const store = new Vuex.Store({ 
    state,
    getters,
    mutations
 });

export default store;