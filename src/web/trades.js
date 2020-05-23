import './scss/trades.scss';

// vendor libraries
import 'bootstrap/js/dist/collapse';
import Vue from 'vue';

// components
import App from './trades.vue';

// scroll button
import './js/scrollButton';

new Vue({
	render: (h) => h(App)
}).$mount('#app');
