<template>
	<tr class="item item-list m-1" :key="item.sku" @click="$emit('item-click', item)">
		<td>
			<a :href="item.statslink" target="_blank" v-on:click.stop="">{{item.sku}}</a>
		</td>
		<td>
			<b :class='{disabled: !item.autoprice}' class="autoprice-symbol">
				$
			</b>
		</td>
		<td :src="item.style.img_small" width="64px" height="64px" style="background-size: contain; background-position: center; background-repeat: no-repeat;" :style="{ backgroundImage: `url( ${item.style.image_small} ), url( ${item.style.effect} )`, backgroundColor: item.style.quality_color, borderStyle: item.style.craftable? false : 'dashed', opacity: item.enabled?1:0.5, borderColor: item.style.border_color}"> 
			<svg class="bi bi-check item-check" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" v-if="selected">
				<path fill-rule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" clip-rule="evenodd"/>
			</svg>
		</td>
		<td>{{item.name}}</td>
		<td>{{item.intent == 2 ? "Bank" : item.intent == 1 ? "Sell" : "buy"}}</td>
		<td >{{item.buy.string}}</td>
		<td >{{item.sell.string}}</td>
		<td>{{item.min}}</td>
		<td>{{item.max}}</td>
	</tr>
</template>

<script>
export default {
	props: ['item', 'selected']
}
</script>
<s
<style lang="scss" scoped>

.item {
	width: 128px; 
	height: 128px;
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
	border: 2px solid black;
	border-radius: 5px;
	position: relative;
}
.item:hover .info {
	visibility: visible;
}
.item-check {
	width: 100%;
	height: 100%;
    background-color:rgba(255, 255, 255, 0.7);
}
.item-grid{
	.autoprice-symbol {
		top: 2px;
		right: 2px;
		position: absolute;
		z-index: 2;
		color: #29a30e;
	}
} 
.info {
    position:relative;
    z-index: 1000;
	width: 100%;
	height: 100%;
	visibility: hidden;
	background-color:rgba(255, 255, 255, 0.7);
	overflow-x: wrap;
	overflow-y: hidden;
	-webkit-user-select: none; /* Safari */        
	-moz-user-select: none; /* Firefox */
	-ms-user-select: none; /* IE10+/Edge */
	user-select: none; /* Standard */
}
.item-check {
	width: 100%;
	height: 100%;
    background-color:rgba(255, 255, 255, 0.7);
}
.ks {
    bottom: 2px;
    left: 2px;
    position: absolute;
    z-index: 2;
}
.intent-symbol {
    top: 2px;
    left: 2px;
    position: absolute;
    z-index: 2;
}
 .item-count {
	text-align: right;
	position: absolute;
	bottom: 0px;
	right: 5px;
 }
 .item-list .autoprice-symbol {
    color: #29a30e;
}
.item-list .autoprice-symbol.disabled {
    color: #cccccc;
}
.item-list{
    width: 100%; 
    height: 64px;
}
</style>