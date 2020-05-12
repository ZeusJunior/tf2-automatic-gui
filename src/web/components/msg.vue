<template>
  	<div v-if="enabled" class="alert" :class="['alert-' + type]" role="alert">
		{{text}}
		<button type="button" class="close" @click="closeMessage">
			<span>&times;</span>
		</button>
	</div>
</template>

<script>
export default {
	data: ()=>{
		return {
			enabled: false,
			text: '',
			type: ''
		}
	},
	methods: {
		closeMessage: function() {
			this.enabled = false;
		},
		sendMessage: function(type, text) {
			this.enabled = true;
			this.text = text;
			this.type = type;
		},
	}
	
}
</script>

<style>

</style>