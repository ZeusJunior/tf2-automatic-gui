// This file is just a copy of tf2-currencies

/**
 * Creates a new Currencies instance
 * @class
 * @param {object} currencies The currencies object
 * @throws Will throw an error if missing currencies object, or if it is not valid
 */
function Currencies(currencies) {
	if (!currencies) {
		throw new Error('Missing currencies object');
	}

	this.keys = parseFloat(currencies.keys || 0);
	this.metal = parseFloat(currencies.metal || 0);

	if (isNaN(this.keys) || isNaN(this.metal)) {
		throw new Error('Not a valid currencies object');
	}

	this.metal = this.toRefined(this.toScrap(this.metal));
}

/**
 * Get the value of the currencies in scrap
 * @since 1.0.0
 * @param {number} conversion The refined value of keys
 * @return {number} The value of the this currencies instance
 * @throws Will throw an error if missing key conversion rate and there are keys
 */
Currencies.prototype.toValue = function(conversion) {
	if (conversion === undefined && this.keys != 0) {
		// The conversion rate is needed because there are keys
		throw new Error('Missing conversion rate for keys in refined');
	}

	let value = this.toScrap(this.metal);
	if (this.keys != 0) {
		value += this.keys * this.toScrap(conversion);
	}
	return value;
};

/**
 * Creates a string that represents this currencies object
 * @since 1.0.0
 * @return {string} Example: 1 key, 20.11 ref
 */
Currencies.prototype.toString = function() {
	let string = '';

	if (this.keys !== 0) {
		// If there are keys, then we will add that to the string
		string = this.keys.toString();
		string += this.keys > 1? ' keys': ' key';
	}

	if (this.metal !== 0 || this.keys === this.metal) {
		if (string !== '') {
			// The string is not empty, that means that we have added the keys
			string += ', ';
		}

		// Add the metal to the string
		string += rounding(Number(this.metal) * 100) / 100 + ' ref';
	}

	return string;
};

/**
 * Creates an object that represents this currencies object
 * @since 1.1.0
 * @return {object} Currencies object
 */
Currencies.prototype.toJSON = function() {
	const json = {
		keys: this.keys,
		metal: this.metal
	};

	return json;
};

Currencies.prototype.toScrap = function(refined) {
	// Get the estimated amount of scrap
	let scrap = refined * 9;
	// Round it to the nearest half
	scrap = Math.round(scrap * 2) / 2;
	return scrap;
};

Currencies.prototype.toRefined = function(scrap) {
	// The converstion rate between scrap and refined is 9 scrap/ref
	let refined = scrap / 9;
	// Truncate it to remove repeating decimals  (10 scrap / 9 scrap/refined = 1.1111...)
	refined = rounding(refined * 100) / 100;
	return refined;
};
Currencies.toRefined = function(scrap) {
	// The converstion rate between scrap and refined is 9 scrap/ref
	let refined = scrap / 9;
	// Truncate it to remove repeating decimals  (10 scrap / 9 scrap/refined = 1.1111...)
	refined = rounding(refined * 100) / 100;
	return refined;
};

/**
 * Rounds a number up or down if the value is less than 0 or not
 * @since 1.2.0
 * @param {number} number Number to round
 * @return {number} Returns the rounded number
 */
function rounding(number) {
	const isPositive = number >= 0;

	// If we add 0.001 and it is greater than the number rounded up, then we need to round up to fix floating point error
	const rounding = number + 0.001 > Math.ceil(number) ? Math.round : Math.floor;
	const rounded = rounding(Math.abs(number));

	return isPositive ? rounded : -rounded;
}
