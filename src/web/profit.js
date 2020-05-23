// scss
import './scss/profit.scss';

// vendor libraries
import 'bootstrap/js/dist/collapse';
import Vue from 'vue';

// components
import App from './profit.vue';


new Vue({
	render: (h) => h(App)
}).$mount('#app');
