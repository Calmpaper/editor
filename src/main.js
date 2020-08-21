import Vue from "vue";
import vueCustomElement from "vue-custom-element";
import App from "./App.vue";
// import svgSpriteLoader from "./helpers/svg-sprite-loader.js";

import "document-register-element/build/document-register-element";

Vue.use(vueCustomElement);

// const __svg__ = {
//   path: "./assets/images/icons/*.svg",
//   name: "assets/images/[hash].sprite.svg"
// };
// svgSpriteLoader(__svg__.filename);

Vue.config.productionTip = false;

Vue.customElement("calmpaper-editor", App);

// new Vue({
//   render: h => h(App)
// }).$mount("#app");
