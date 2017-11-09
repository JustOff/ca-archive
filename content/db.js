"use strict";
let EXPORTED_SYMBOLS = ["DB"];

var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

function copyDataURLToFile(document, url, file, callback) {
  NetUtil.asyncFetch(url, function(istream) {
    let ostream = Cc["@mozilla.org/network/file-output-stream;1"].
                  createInstance(Ci.nsIFileOutputStream);
    ostream.init(file, -1, -1, Ci.nsIFileOutputStream.DEFER_OPEN);
    NetUtil.asyncCopy(istream, ostream, function(result) {
      callback && callback(file, result, document);
    });
  });
}

function showMessage(document, msg, style) {
	let div = document.createElement("div");
	div.className = style;
	div.appendChild(document.createTextNode(msg));
	let page = document.getElementById("page");
	page.appendChild(div);
}

let DB = {

	db: null,

	openDB: function(dbname, document) {
		let dir = Services.dirsvc.get("ProfD", Ci.nsIFile); dir.append("ca-archive");
		try {
			let storageService = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
			let dbFile = dir.clone(); dbFile.append(dbname);
			if (dbFile.exists() && dbFile.fileSize > 0) {
				this.db = storageService.openDatabase(dbFile);
			} else {
				if (!dir.exists()) {
					showMessage(document, "Performing initial database provisioning ...", "db-warning ok");
					throw "Init";
				} else {
					throw "CA Archive database has jast been updated, not ready or corrupted!";
				}
			}
			return true;
		} catch (e) {
			if (e != "Init") {
				Cu.reportError(e);
				showMessage(document, e, "db-warning");
				showMessage(document, "Trying to (re)provision database, please wait ...", "db-warning");
			}
			let tmpFile = FileUtils.getFile("TmpD", ["ca-archive.tmp"]);
			tmpFile.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
			let src = Services.io.newURI("chrome://ca-archive/content/db/" + dbname, null, null);
			copyDataURLToFile(document, src, tmpFile, function(file, result, document) {
				try {
					if (result == 0 && file.exists()) {
						if (dir.exists()) {
							dir.remove(true);
						}
						dir.create(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
						tmpFile.moveTo(dir, dbname);
						showMessage(document, "Database has been processed successfully!", "db-warning ok");
						showMessage(document, "Please reload the page.", "db-warning ok");
					} else {
						throw "CA Archive database Fatal Error!";
					}
				} catch (e) {
					Cu.reportError(e);
					showMessage(document, e, "db-warning bad");
					showMessage(document, "Try to reinstall CA Archive.", "db-warning bad");
				}
			});
			return false;
		}
	},

	closeDB: function() {
		this.db.close();
	}

};