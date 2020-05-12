module.exports = {
	env: {
		commonjs: true,
		es6: true,
		node: true
	},
	extends: [
		'google'
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly'
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module' // webpack import export throws errors otherwise
	},
	rules: {
		'indent': ['error', 'tab'],
		'no-tabs': 0,
		'max-len': 0,
		'linebreak-style': 0,
		'quote-props': ['warn', 'consistent-as-needed', {numbers: false}],
		'no-trailing-spaces': ['error', {
			skipBlankLines: true,
			ignoreComments: true
		}],
		'comma-dangle': ['error', 'never'],
		'require-jsdoc': 2,
		'space-before-function-paren': ['error', {
			anonymous: 'never',
			named: 'never',
			asyncArrow: 'always'
		}],
		'object-curly-spacing': 0,
		'new-cap': 0,
		'no-useless-catch': 'error'
	}
};
