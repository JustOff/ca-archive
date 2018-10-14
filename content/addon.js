"use strict";
let EXPORTED_SYMBOLS = ["Addon"];

var Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

let Addon = {

	showPage: function(document, db, query) {
		document.body.className += " gutter addon-details";
		let data = this.loadData(db, query);
		document.title = data.name + " :: Classic Add-ons Archive";
		let template = this.template;
		template = this.processTemplate(template, data);

		let contfrag = document.createRange().createContextualFragment(template);
		let frag = contfrag.firstElementChild;
		let page = document.getElementById("page");
		page.appendChild(frag);
	},

	loadData: function(db, query) {
		let col;
		if (/^\d+$/.test(query)) {
			col = "addon_id";
		} else {
			col = "slug";
		}
		let data = {};
		let dbQuery = db.createStatement("SELECT COUNT(*) as count FROM addons INNER JOIN versions ON addons.addon_id = versions.addon_id WHERE addons." + col + " = :query");
		dbQuery.params.query = query;
		dbQuery.executeStep();
		data.count = dbQuery.row.count;
		dbQuery.finalize();

		dbQuery = db.createStatement("SELECT addons.addon_id AS addon_id, addons.name AS name, slug, is_experimental, users, reviews, rating, summary, description, homepage, dev_comments, support_email, support_url, r1, r2, r3, r4, r5, version, release_notes, is_restart_required, versions.url AS url, min, max, size, created, licenses.name AS lic_name, licenses.url AS lic_url, eulas.rowid AS eula, policies.rowid AS policy, icon FROM addons INNER JOIN versions ON addons.addon_id = versions.addon_id LEFT JOIN licenses ON licenses.license_id = versions.license_id LEFT JOIN eulas ON eulas.addon_id = addons.addon_id LEFT JOIN policies ON policies.addon_id = addons.addon_id LEFT JOIN icons ON addons.addon_id = icons.addon_id WHERE addons." + col + " = :query ORDER BY versions.created DESC, versions.version DESC LIMIT 1");
		dbQuery.params.query = query;
		dbQuery.executeStep();
		let id = dbQuery.row.addon_id;
		data.reviews = new Intl.NumberFormat("en-US").format(dbQuery.row.reviews);
		data.rating = Math.round(dbQuery.row.rating);
		data.users = new Intl.NumberFormat("en-US").format(dbQuery.row.users);
		if (dbQuery.row.icon) {
			data.icon_url = "chrome://ca-archive/skin/icons/" + dbQuery.row.icon + ".png";
		} else {
			data.icon_url = "chrome://ca-archive/skin/icons/" + Math.trunc(dbQuery.row.addon_id/1000) + "/" + dbQuery.row.addon_id + ".png";
		}
		data.name = dbQuery.row.name;
		data.slug = dbQuery.row.slug;
		data.amo = "https://addons.mozilla.org/addon/" + data.slug + "/";
		data.wbm = "https://web.archive.org/web/*/https://addons.mozilla.org/en-US/firefox/addon/" + data.slug + "/";
		data.summary = dbQuery.row.summary.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;");
		if (dbQuery.row.homepage) {
			data.homepage = '<li><a class="home" href="' + dbQuery.row.homepage + '">Add-on home page</a></li>';
		} else {
			data.homepage = "";
		}
		if (dbQuery.row.support_url) {
			data.support_url = '<li><a class="support" href="' + dbQuery.row.support_url + '">Support site</a></li>';
		} else {
			data.support_url = "";
		}
		let experiment = "", warning = "";
		if (dbQuery.row.is_experimental) {
			experiment = 'caution';
			warning = '<p class="warning">This add-on has been preliminarily reviewed or marked as experimental by its developers.</p>';
			}
		data.experiment = experiment;
		data.warning = warning;
		if (dbQuery.row.support_email) {
			data.support_email = '<li><a class="email" href="mailto:' + dbQuery.row.support_email + '">Support E-mail</a></li>';
		} else {
			data.support_email = "";
		}
		data.description = dbQuery.row.description.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;");
		if (data.description == "") {
			data.description = data.summary;
		}
		if (dbQuery.row.dev_comments != "") {
			data.dev_comments = this.devcomm.replace("%DEVCOMM%", dbQuery.row.dev_comments.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;"));
		} else {
			data.dev_comments = "";
		}
		data.version = dbQuery.row.version;
		data.release_notes = dbQuery.row.release_notes.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;");
		data.restart = "";
		if (dbQuery.row.is_restart_required == false) {
			data.restart = '&nbsp;<span class="no-restart">No Restart</span>';
		}
		data.min = dbQuery.row.min;
		data.max = dbQuery.row.max;
		let appver;
		if (Services.appinfo.name == "Pale Moon") {
			appver = "27.9";
		} else if (Services.appinfo.name != "SeaMonkey") {
			appver = Services.appinfo.version;
		}
		data.downurl = "https://ca-archive.biz.tm/storage/" + Math.trunc(dbQuery.row.addon_id/1000) + "/" + dbQuery.row.addon_id + "/" + dbQuery.row.url.replace(/^\d+\/(.*)/,"$1") + "?origin=caa&action=";
		if (appver && Services.vc.compare(dbQuery.row.min, appver) <= 0 && Services.vc.compare(appver, dbQuery.row.max) <= 0) {
			data.compat = "add";
			data.action = "Install Now";
			data.downurl += "install";
		} else {
			data.compat = "download";
			data.action = "Download";
			data.downurl += "download";
		}
		let created = new Date(dbQuery.row.created*1000);
		data.created = created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
		let nBytes = dbQuery.row.size;
		for (let aMultiples = ["KiB", "MiB", "GiB"], nMultiple = 0, nApprox = nBytes / 1024; 
				nApprox > 1; nApprox /= 1024, nMultiple++) {
			data.size = nApprox.toFixed(1) + " " + aMultiples[nMultiple];
		};
		if (dbQuery.row.lic_url !== null) {
			let lic_url, target;
			if (dbQuery.row.lic_url != "") {
				lic_url = dbQuery.row.lic_url;
				target = 'target="_blank"';
			} else {
				lic_url = "caa:addon/" + data.slug + "/license/" + data.version;
				target = '';
			}
			data.license = '<li class="source-license">Released under <a ' + target + ' href="' + lic_url + '">' + dbQuery.row.lic_name + '</a></li>'; 
		} else {
			data.license = "";
		}
		if (dbQuery.row.eula) {
			data.eula = '<a class="eula badge" href="caa:addon/' + data.slug + '/eula">End-User License Agreement</a>'; 
		} else {
			data.eula = "";
		}
		if (dbQuery.row.policy) {
			data.policy = '<a class="privacy-policy badge" href="caa:addon/' + data.slug + '/privacy">Privacy Policy</a>'; 
		} else {
			data.policy = "";
		}

		let grating = dbQuery.row.r1 + dbQuery.row.r2 + dbQuery.row.r3 + dbQuery.row.r4 + dbQuery.row.r5;
		if (grating > 0) {
			let item = this.grating;
			item = item.replace("%R1%", dbQuery.row.r1);
			item = item.replace("%R2%", dbQuery.row.r2);
			item = item.replace("%R3%", dbQuery.row.r3);
			item = item.replace("%R4%", dbQuery.row.r4);
			item = item.replace("%R5%", dbQuery.row.r5);
			item = item.replace("%R1P%", Math.round(dbQuery.row.r1/grating*100));
			item = item.replace("%R2P%", Math.round(dbQuery.row.r2/grating*100));
			item = item.replace("%R3P%", Math.round(dbQuery.row.r3/grating*100));
			item = item.replace("%R4P%", Math.round(dbQuery.row.r4/grating*100));
			item = item.replace("%R5P%", Math.round(dbQuery.row.r5/grating*100));
			data.grating = item;
		} else {
			data.grating = "";
		}
		dbQuery.finalize();

		dbQuery = db.createStatement("SELECT tag_name FROM tags WHERE addon_id = :addon_id ORDER BY tag_name");
		dbQuery.params.addon_id = id;
		let tags = [];
		while (dbQuery.executeStep()) {
			tags.push(dbQuery.row.tag_name);
		}
		if (tags.length > 0) {
			data.tags = '<div class="clearboth"><h3 class="compact-bottom">Tags</h3><div id="tagbox"><ul class="addon-tags nojs">';
			for (let tag of tags) {
				data.tags += '<li class="tag"><a href="caa:list?tag=' + tag + '" class="tagitem"> ' + tag + ' </a></li>';
			}
			data.tags += "</ul></div></div>";
		} else {
			data.tags = "";
		}
		dbQuery.finalize();

		dbQuery = db.createStatement("SELECT cat_name FROM categories WHERE addon_id = :addon_id ORDER BY cat_name");
		dbQuery.params.addon_id = id;
		let categories = [];
		while (dbQuery.executeStep()) {
			categories.push(dbQuery.row.cat_name);
		}
		if (categories.length > 0) {
			let cat_names = { "alerts-updates": "Alerts &amp; Updates", "appearance": "Appearance", "bookmarks": "Bookmarks", "download-management": "Download Management", "feeds-news-blogging": "Feeds, News &amp; Blogging", "games-entertainment": "Games &amp; Entertainment", "language-support": "Language Support", "photos-music-videos": "Photos, Music &amp; Videos", "privacy-security": "Privacy &amp; Security", "search-tools": "Search Tools", "shopping": "Shopping", "social-communication": "Social &amp; Communication", "tabs": "Tabs", "web-development": "Web Development", "other": "Other"};
			data.categories = "<h3>Related Categories</h3><ul>";
			for (let category of categories) {
				data.categories += '<li><a href="caa:list/category' + category + '">' + cat_names[category] + '</a></li>';
			}
			data.categories += "</ul>";
		} else {
			data.categories = "";
		}
		dbQuery.finalize();

		dbQuery = db.createStatement("SELECT name, slug FROM authors_addons INNER JOIN authors ON authors_addons.author_id = authors.author_id WHERE addon_id = :addon_id ORDER BY name");
		dbQuery.params.addon_id = id;
		data.authors = '<h4 class="author">by ';
		while (dbQuery.executeStep()) {
			data.authors += '<a target="_blank" href="https://addons.mozilla.org/en-US/firefox/user/' + dbQuery.row.slug + '/" title="' + dbQuery.row.name + '">' + dbQuery.row.name + '</a>, ';
		}
		data.authors = data.authors.slice(0, -2);
		data.authors += '</h4>';
		dbQuery.finalize();

		return data;
	},

	processTemplate: function(template, data) {
		template = template.replace("%REVIEWS%", data.reviews);
		template = template.replace("%GRATING%", data.grating);
		template = template.replace(/%RATING%/g, data.rating);
		template = template.replace("%USERS%", data.users);

		template = template.replace("%ICON%", data.icon_url);
		template = template.replace(/%NAME%/g, data.name);
		template = template.replace(/%SLUG%/g, data.slug);
		template = template.replace(/%VERSION%/g, data.version);
		template = template.replace("%RESTART%", data.restart);
		template = template.replace("%AUTHORS%", data.authors);
		template = template.replace("%SUMMARY%", data.summary);
		template = template.replace("%EXPERIMENT%", data.experiment);
		template = template.replace("%COMPAT%", data.compat);
		template = template.replace("%ACTION%", data.action);
		template = template.replace("%WARNING%", data.warning);
		template = template.replace("%DOWNURL%", data.downurl);
		template = template.replace("%PRIVACY%", data.policy);
		template = template.replace("%EULA%", data.eula);

		template = template.replace("%HOME%", data.homepage);
		template = template.replace("%SUPPORT%", data.support_url);
		template = template.replace("%EMAIL%", data.support_email);
		template = template.replace("%LICENSE%", data.license);

		template = template.replace("%ABOUT%", data.description);

		template = template.replace(/%RELDATE%/g, data.created);
		template = template.replace("%SIZE%", data.size);
		template = template.replace(/%COMPATV%/g, "Firefox " + data.min + " - " + data.max);
		template = template.replace("%RELNOTE%", data.release_notes);
		template = template.replace("%DEVCOMM%", data.dev_comments);

		template = template.replace("%CATEGORIES%", data.categories);
		template = template.replace("%TAGS%", data.tags);

		template = template.replace(/%COUNT%/g, data.count);
		template = template.replace(/%AMO%/g, data.amo);
		template = template.replace(/%WBM%/g, data.wbm);

		return template;
	},

	template: `<html>
 <body>

      <div itemscope="" itemtype="http://schema.org/WebApplication">
        <aside class="secondary addon-vitals">

          <div itemprop="aggregateRating" itemscope="" itemtype="http://schema.org/AggregateRating">
            <span class="stars large stars-%RATING%" title="Rated %RATING% out of 5 stars">Rated %RATING% out of 5 stars</span>

            <div>
              <span itemprop="ratingCount">%REVIEWS%</span> user reviews
            </div>
          </div>

          %GRATING%

          <div id="daily-users">
            %USERS% users
          </div>

        </aside>

        <section class="primary" id="addon-description-header">
          <div id="addon" class="island c" role="main" data-id="1865">
            <hgroup>
              <a target="_blank" href=%AMO% title="Open on AMO"><img class="amologo" src="chrome://ca-archive/skin/amo2k17.png"></a>
              <a target="_blank" href=%WBM% title="Open on Wayback Machine"><img class="wbmlogo" src="chrome://ca-archive/skin/logo_archive-sm.png"></a>
              <img id="addon-icon" itemprop="image" src="%ICON%" class="icon" alt="Icon of %NAME%">
              <h1 class="addon">
                <span itemprop="name">%NAME%</span>
                <span class="version-number" itemprop="version">%VERSION%</span>
                %RESTART%
              </h1>
              %AUTHORS%
            </hgroup>
            <p id="addon-summary" itemprop="description">%SUMMARY%</p>
            <div class="install-wrapper featuredaddon">
              <div class="install-shell">
                <div class="install">
                  <p class="install-button">
                    <a class="button prominent %EXPERIMENT% %COMPAT%" href="%DOWNURL%">
                      <span>%ACTION%</span>
                    </a>
                  </p>
                </div> 
                %PRIVACY%
                %EULA%
                <div class="d2c-reasons-popup popup">
                  <p>This add-on is not compatible with your version of Firefox because of the following:</p>
                  <ul></ul>
                </div>
                <div class="head-vercompat">
                  <span class="head-right"><a href="caa:addon/%SLUG%/versions">View all %COUNT% versions</a></span>
                  <span class="head-left">Works with %COMPATV%</span>
                  <p class="head-center">Released on %RELDATE%</p>
                </div>
                <p><a id="downloadAnyway" hidden="true">Download Anyway</a></p>
              </div>
              %WARNING%
            </div>
          </div>
        </section>

        <aside class="secondary metadata c">
          <ul class="links">
            %HOME%
            %SUPPORT%
            %EMAIL%
          </ul>
          <ul>
            %LICENSE%
          </ul>
        </aside>

        <section class="primary island c">
          <h2>About this Add-on</h2>
          <div class="prose">
            <div id="addon-description" class="prose">%ABOUT%
            </div>
          </div>
        </section>

        <aside class="secondary metadata c">
          %CATEGORIES%
          %TAGS%
        </aside>

        <section class="primary island more-island">

          %DEVCOMM%

          <section id="detail-relnotes" class="expando">
            <h2>Version Information<a class="toggle" href="#detail-relnotes"><b></b></a></h2>
            <div class="content listing">
              <div class="items">
                <div class="version item" id="version-%VERSION%">
                  <div class="info">
                    <h3>
                      <a href="caa:addon/%SLUG%/versions/2.7.2" title="Permanent link to this version">Version %VERSION%</a>
                      <span class="meta">
                        <time>Released %RELDATE%</time>
                        <span class="filesize">%SIZE%</span>
                      </span>
                      <span class="meta compat">Works with %COMPATV%</span>
                    </h3>

                    <div class="desc prose">%RELNOTE%
                    </div>

                  </div>
                </div>
              </div>
              <p class="more c">
                <a class="more-info" href="caa:addon/%SLUG%/versions">View all %COUNT% versions</a>
              </p>
            </div>
          </section>

        </section>
      </div>

 </body>
</html>`,

	grating: `
          <div>
            <ul class="grouped_ratings">
              <li class="c">  <span class="stars stars-5" title="Rated 5 out of 5 stars">Rated 5 out of 5 stars</span>
                <div class="rating_bar">
                  <span class="bar" style="width:%R5P%%"><span class="num_ratings">%R5%</span></span>
                </div>
              </li>
              <li class="c">  <span class="stars stars-4" title="Rated 4 out of 5 stars">Rated 4 out of 5 stars</span>
                <div class="rating_bar">
                  <span class="bar" style="width:%R4P%%"><span class="num_ratings">%R4%</span></span>
                </div>
              </li>
              <li class="c">  <span class="stars stars-3" title="Rated 3 out of 5 stars">Rated 3 out of 5 stars</span>
                <div class="rating_bar">
                  <span class="bar" style="width:%R3P%%"><span class="num_ratings">%R3%</span></span>
                </div>
              </li>
              <li class="c">  <span class="stars stars-2" title="Rated 2 out of 5 stars">Rated 2 out of 5 stars</span>
                <div class="rating_bar">
                  <span class="bar" style="width:%R2P%%"><span class="num_ratings">%R2%</span></span>
                </div>
              </li>
              <li class="c">  <span class="stars stars-1" title="Rated 1 out of 5 stars">Rated 1 out of 5 stars</span>
                <div class="rating_bar">
                  <span class="bar" style="width:%R1P%%"><span class="num_ratings">%R1%</span></span>
                </div>
              </li>
            </ul>
          </div>`,

	devcomm: `
          <section class="expando" id="developer-comments">
            <h2>Developer's Comments<a class="toggle" href="#developer-comments"><b></b></a></h2>
            <div class="content prose">
              <p>%DEVCOMM%</p>
            </div>
          </section>`

};