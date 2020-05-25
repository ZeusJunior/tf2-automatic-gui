module.exports = function({ item }) {
	if (hasEffect(item)) {
		fixUnusualQuality(item);
	} else if (isPaintKit(item)) {
		fixPaintKitQuality(item);
	}
};

// eslint-disable-next-line require-jsdoc
function hasEffect({ effect }) {
	return effect != null;
}

// eslint-disable-next-line require-jsdoc
function fixUnusualQuality(item) {
	if (item.quality === 11) {
		item.quality2 = 11;
	}

	item.quality = 5;
}

// eslint-disable-next-line require-jsdoc
function isPaintKit({ paintkit }) {
	return paintkit != null;
}

// eslint-disable-next-line require-jsdoc
function fixPaintKitQuality(item) {
	if (item.quality2 === 11) {
		item.quality = 11;
		item.quality2 = null;
	}
}
