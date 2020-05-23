// scss
import './scss/index.scss';

// vendor libraries
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/collapse';
import Vue from 'vue';
import AsyncComputed from 'vue-async-computed';

// components
import App from './index.vue';

Vue.use(AsyncComputed);

new Vue({
	render: (h) => h(App)
}).$mount('#app');
