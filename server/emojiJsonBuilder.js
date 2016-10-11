'use strict';

const fs = require('fs');


const minJsonPath = '../../whatsapp_emojis/emojis_min.json';
const jsonPath = '../../whatsapp_emojis/emojis.json';
const emojiKeyMapPath = '../../whatsapp_emojis/emoji_key_mapping.json';
const emojiTagMapPath = '../../whatsapp_emojis/emoji_tag_mapping.json';
const localJsonPath = '../../whatsapp_emojis/updated_emoji.json';

function _writeFile(file, data, callback){
	console.log(`Writing to ${file}`);

	fs.writeFile(file, data, (err) => {
		if (err) {
			callback(false, err);
		}

		callback(true)
	});
}

function saveMinifiedJSON(data, callback){
	_writeFile(minJsonPath, data, callback);
}

function savePrettyPrintedJSON(data, callback){
	let json = "{";
	let emojis = JSON.parse(data);

	const keys = Object.keys(emojis);
	keys.forEach((key, index) => {
		let obj = '\n\t"' + key + '": {\n' +
			'\t\t"key": "' + key + '", \n' +
			'\t\t"tags": ' + JSON.stringify(emojis[key].tags) + ', \n' +
			'\t\t"value": "' + emojis[key].value + '"\n' +
			'\t}';

		if (index + 1 !== keys.length) obj += ',';

		json += obj;
	});

	json += '\n}';


	_writeFile(jsonPath, json, callback);
}

function sort(){
	console.log(`Reading json from ${minJsonPath}`);

	fs.readFile(minJsonPath, (err, data) => {
		if (err) throw err;
		const json = JSON.parse(data.toString("utf-8"));

		const sortedJsonByKeys = _bucketSort(json, "2 char Key", (key) => {
			return key.substring(0, 2);
		});

		const sortedJsonByTags = _bucketSort(json, "Tags", (key, obj) => {
			return obj.tags;
		});

		const writeKeyMap = _promisify(function(callback) {
			_writeFile(emojiKeyMapPath,
					JSON.stringify(_ensureBucketsAreSorted(sortedJsonByKeys)),
					(success, error) => {
				console.log('Saved Emoji Key Map.');
				callback();
			});
		});

		const writeTagMap = _promisify(function(callback) {
			_writeFile(emojiTagMapPath,
					JSON.stringify(_ensureBucketsAreSorted(sortedJsonByTags)),
					(success, error) => {
				console.log('Saved Emoji Tag Map.');
				callback();
			});
		})

		Promise.all([writeKeyMap, writeTagMap]).then(() => {
			console.log('Sorting complete. All Done!');
		});
	});
}

function _bucketSort(data, sortBy, keyFunction){
	console.log(`Performing Bucket Sort by ${sortBy}`);

	let json = {};
	let maxBucketSize = 0;
	Object.keys(data).forEach((key) => {
		const bucket = keyFunction(key, data[key]);

		if (Array.isArray(bucket)) {
			bucket.forEach((b) => {
				maxBucketSize = _saveInBucket(json, b, key, maxBucketSize);
			});
		} else {
			maxBucketSize = _saveInBucket(json, bucket, key, maxBucketSize);
		}
	});

	console.log(`Success Performing Bucket Sort by ${sortBy}`);
	console.log(`Biggest Bucket Size = ${maxBucketSize}`);

	return json;
}

function _saveInBucket(buckets, bucket, data, maxBucketSize){
	if (!buckets[bucket]) buckets[bucket] = [data];
	else buckets[bucket].push(data);

	const bucketSize = buckets[bucket].length;

	return (bucketSize > maxBucketSize) ? bucketSize : maxBucketSize;
}

function _ensureBucketsAreSorted(buckets){
	console.log('Explicitly ensuring all the buckets are sorted');
	const ensureSort = {};

	Object.keys(buckets).forEach((bucket) => {
		ensureSort[bucket] = buckets[bucket].sort();
	});

	console.log('...Done');
	return ensureSort;
}

function sortLocal(){
	fs.readFile(localJsonPath, (err, data) => {
		if (err) throw err;
		const json =
			_extractValidEmojiProps(JSON.parse(data.toString("utf-8")));

		const sortedJsonByKeys = _bucketSort(json, "2 char Key", (key) => {
			return key.substring(0, 2);
		});

		const writeKeyMap = _promisify(function(callback) {
			_writeFile(emojiKeyMapPath,
					JSON.stringify(_ensureBucketsAreSorted(sortedJsonByKeys)),
					(success, error) => {
				console.log('Saved Emoji Key Map.');
				callback();
			});
		});

		const writeMinifiedJson = _promisify(function(callback) {
			_writeFile(minJsonPath, JSON.stringify(json), (success, error) => {
				console.log('Saved Minified Map.');
				callback();
			});
		});

		Promise.all([writeKeyMap, writeMinifiedJson]).then(() => {
			console.log('Sorting complete. All Done!');
		});
	});
}

function _extractValidEmojiProps(data){
	let json = {};
	data.forEach((obj) => {
		if (obj.has_img_twitter) {
			const key = `:${obj.short_name}:`.replace('-', '_');
			const value = getUnicodeCharacter(parseInt(obj.unified, 16));

			json[key] = {
				"key": key,
				"value": value,
				"x": obj.sheet_x,
				"y": obj.sheet_y
			};
		}
	});

	return json;
}

function getUnicodeCharacter(cp) {
	if (cp >= 0 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFF) {
        return String.fromCharCode(cp);
    } else if (cp >= 0x10000 && cp <= 0x10FFFF) {

        // we substract 0x10000 from cp to get a 20-bits number
        // in the range 0..0xFFFF
        cp -= 0x10000;

        // we add 0xD800 to the number formed by the first 10 bits
        // to give the first byte
        const first = ((0xffc00 & cp) >> 10) + 0xD800

        // we add 0xDC00 to the number formed by the low 10 bits
        // to give the second byte
        const second = (0x3ff & cp) + 0xDC00;

        return String.fromCharCode(first, second);
    }
}

function _promisify(func) {
	const promise = new Promise((resolver) => {
		func(() => {
			resolver();
		});
	});

	return promise;
}

module.exports = {
	doAll: function(data, callback){
		let _status;
		let _err = [];

		function _callback(status, error) {
			if (error) {
				_err.push(error);
			}

			_status = _status && status;
		}

		saveMinifiedJSON(data, _callback);
		savePrettyPrintedJSON(data, _callback);

		console.log('Success saving emojis');
		callback(_status, _err);
	},
	sort: sort,
	sortLocal: sortLocal
}