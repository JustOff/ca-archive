"use strict";
(function () {
	var Cu = Components.utils;

	let dbname = "ca-archive-18090701.sqlite";

	Cu.import("chrome://ca-archive/content/db.js");
	if (!DB.openDB(dbname, document)) {
		return;
	}

/*
	caa:addon/{slug|id}/versions[?page=[#ver]]
	caa:addon/{slug|id}/{eula|privacy|license/lid}
	caa:addon/{slug|id}
	caa:list[/category][?{tag|q}=][?sort=][?page=]
	caa:[search-query]
*/

	try {
		let params, url = decodeURI(document.location);
		if ((params = /^caa:addon\/(.+?)\/versions\/?(\?page=(\d+)(#.+)?)?$/.exec(url)) !== null) {
			Cu.import("chrome://ca-archive/content/versions.js");
			Versions.showPage(document, DB.db, params[1], params[3]);
		} else if ((params = /^caa:addon\/(.+?)\/(eula|privacy|license\/(.+))$/.exec(url)) !== null) {
			Cu.import("chrome://ca-archive/content/epl.js");
			EPL.showPage(document, DB.db, params[1], params[2], params[3]);
		} else if ((params = /^caa:addon\/(.+?)\/?$/.exec(url)) !== null) {
			Cu.import("chrome://ca-archive/content/addon.js");
			Addon.showPage(document, DB.db, params[1]);
		} else if ((params = /^caa:list(\/([a-z-]+))?(\?tag=(.+?)|\?q=(.+?))?([\?|\&]sort=(\w+))?\&?(page=(\d+))?$/.exec(url)) !== null) {
			Cu.import("chrome://ca-archive/content/list.js");
			List.showPage(document, DB.db, params[2], params[4], params[5], params[7], params[9]);
		} else if (url == "caa:") {
			Cu.import("chrome://ca-archive/content/tcloud.js");
			TCloud.showPage(document, DB.db);
		} else if (url == "caa:about") {
			Cu.import("chrome://ca-archive/content/about.js");
			About.showPage(document, DB.db);
		} else if ((params = /^caa:(.+)$/.exec(url)) !== null) {
			Cu.import("chrome://ca-archive/content/list.js");
			List.showPage(document, DB.db, undefined, undefined, params[1], undefined, undefined);
		} else {
			document.location = "caa:list";
		}
	} catch (e) {
		Cu.reportError(e);
	}
	DB.closeDB();

})();
