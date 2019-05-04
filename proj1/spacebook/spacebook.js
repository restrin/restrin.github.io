/* The (relative) URL where the user's data is located. You should not need to use this directly. */
var url = "../cdn/data.enc";

/* The salt used to derive a key from the user's password. */
var salt = "8a4785891590ea6a43b858d73af65f12f3376947d0717585dead654457ceecf0";

/* The IV that was used to encrypt the user's data */
var iv = new Uint8Array([0x72, 0x0d, 0x30, 0x32, 0x5a, 0xda, 0x6c, 0x56, 0xcc, 0x1c, 0x2d, 0xd4]);

/* The Merkle tree. merkle_root is the root of the tree, and merkle_tree contains the Merkle path.
 * merkle_tree[0] is a leaf node, merkle_tree[1] is one level up, etc. 
 *
 *                               merkle_root
 *                                 +     +
 *                                 |     |
 *                       <---------+     +--------->
 *                   [compute]               merkle_tree[2]
 *                     +   +
 *                <----+   +------->
 *            [compute]      merkle_tree[1]
 *              +   +
 *     <--------+   +------>
 * SHA256(data)      merkle_tree[0]
 *
 * */
var merkle_root = '2c53caff52f43b08b34e105ae67d8c33f0b33a297db7f749ff1b2a6deb646041';
var merkle_tree = ['8e86c8a733ce58e68e01a24a271f961346a4437584eec89f39bb0f3246b7759b',
        '5f08975093846d9f49e8bb7808672305b8e7824f410075f2a36b2c8acc072d12',
        '73ad4bcfc747f04d8d92d5ba3c9b0e7d678775b2df618bff0a2f700b20673cb5'];

var compareMerkleHash = function( hash1, hash2 ) {
	return hash1 === hash2;
};

var passwordEntered = function() {
    if (typeof data === "undefined") {
        if (window.location.href.substring(0,4) === "file") {
            console.warn("file:// URL detected. This webpage should be served using a web server.",
                    "See the assignment handout for details about how to run the assignment.");
        }
        throw("Not ready!");
    }
    var password = document.getElementById('password').value;

    /* TODO: your implementation here! */

	/* Check if data is valid */
	var datahash = lib.sha256Hash(data);

	var valid = datahash.then(function(hash) {
		var input = lib.hexToArrayBuffer(lib.arrayBufferToHex(hash).concat(merkle_tree[0]));
		return lib.sha256Hash(input)
	}).then(function(hash) {
		var input = lib.hexToArrayBuffer(lib.arrayBufferToHex(hash).concat(merkle_tree[1]));
		return lib.sha256Hash(input)
	}).then(function(hash) {
		var input = lib.hexToArrayBuffer(lib.arrayBufferToHex(hash).concat(merkle_tree[2]));
		return lib.sha256Hash(input)
	}).then(function(hash) {
		return lib.arrayBufferToHex(hash) === merkle_root;
	});
	
	/* Display image on correct password */
	var hash = lib.balloonHash(password, salt);
	var raw_key = hash.then(function (val) {
		return val.slice(0,32);
	});
	var key = raw_key.then(function (val) {
		return lib.importKey(val);
	},
	function (err) {
		console.log("Failed to import key!");
	});
	
	valid.then(function(isValid) {
		if (isValid) {
			key.then(function(keyObj) {
				lib.decrypt(keyObj, data, iv).then(function(image) {
					displayImage(image);
				},
				function (err) {
					console.log("Failed to decrypt!");
				});
			});
		}
	});
	
    /* Your implementation will make heavy use of Promises. 
     * Here is an example use of Promises:
     * 
     *     returnFour.then(function (i) {
     *         addFive(i).then(function(out) {
     *             console.log(out);
     *         });
     *     });
     *
     * Assuming that returnFour and addFive return Promises,
     * and otherwise work as their names suggest,
     * the number 9 should be printed to the console.
     */
};

/* Loads the encrypted data */
var data;
lib.getData(url).then(function(arr) {
    data = arr;
});

/* Displays the decrypted image */
/* Source: https://jsfiddle.net/Jan_Miksovsky/yy7Zs/ */
var displayImage = function(arraybuffer) {
    var view = new Int8Array(arraybuffer);
    var blob = new Blob([view], { type: "image/png" });
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    var img = document.createElement("img");
    img.src = imageUrl;
    document.getElementById("photos").appendChild(img);
};
