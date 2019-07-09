import Vue from "vue";
import Router from "vue-router";
import Map from "@/components/Map";
import Navigation from "@/components/Navigation";

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: "/",
            name: "Map",
            component: Map
        },
        {
            path: "/nav",
            name: "Navigation",
            component: Navigation
        }
    ]
});
