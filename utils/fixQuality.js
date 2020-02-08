module.exports = function({ item }) {
	if (hasEffect(item)) fixUnusualQuality(item);
	else if (isPaintKit(item)) fixPaintKitQuality(item);
};

function hasEffect({ effect }) {
	return effect != null;
}

function fixUnusualQuality(item) {
	if (item.quality === 11) {
		item.quality2 = 11;
	}

	item.quality = 5;
}

function isPaintKit({ paintkit }) {
	return paintkit != null;
}

function fixPaintKitQuality(item) {
	if (item.quality2 === 11) {
		item.quality = 11;
		item.quality2 = null;
	}
}
