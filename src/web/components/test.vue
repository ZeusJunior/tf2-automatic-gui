<template>
<li>
{{name}}
</li>
</template>

<script>
export default {
	props: [
		'name'
	],
	data: ()=>{
		return {
			name: ''
		}		
	}
}
</script>

<style lang="scss">

</style>