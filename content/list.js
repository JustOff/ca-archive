"use strict";
let EXPORTED_SYMBOLS = ["List"];

var Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

let List = {

	showPage: function(document, db, cat, tag, search, sort, page) {
		let cats = {"alerts-updates": 0, "appearance": 1, "bookmarks": 2, "download-management": 3, "feeds-news-blogging": 4, "games-entertainment": 5, "language-support":6 , "photos-music-videos": 7, "privacy-security": 8, "search-tools": 9, "shopping": 10, "social-communication": 11, "tabs": 12, "web-development": 13, "other": 14};
		let catnames = ["Alerts & Updates", "Appearance", "Bookmarks", "Download Management", "Feeds, News & Blogging", "Games & Entertainment", "Language Support", "Photos, Music & Videos", "Privacy & Security", "Search Tools", "Shopping", "Social & Communication", "Tabs", "Web Development", "Other"];
		let catstyle = ["72", "14", "22", "5", "1", "142", "37", "38", "12", "13", "141", "71", "93", "4", "73"];
		if (cat === undefined || !(cat in cats)) {
			cat = "";
		}

		if (tag === undefined) {
			tag = "";
		}

		if (search === undefined || search == "list?q=") {
			search = "";
		} else {
			search = decodeURIComponent(search.replace(/\+/g, " ").trim());
			document.getElementById("search-q").value = search;
		}

		let sorts = {"users": 0, "rating": 1, "reviews": 2, "created": 3, "updated": 4, "name": 5};
		let sortnames = ["Most Popular Extensions", "Top-Rated Extensions", "Most Reviewed Extensions", "Newest Extensions", "Recently Updated Extensions", "Extensions by Name"];
		if (sort === undefined || !(sort in sorts)) {
			sort = "users";
		}
		if (page === undefined) {
			page = 1;
		}

		document.body.className += " extensions s-" + sort;
		if (cat != "") {
			let css = '#c-%N% a{background:#ecf5fe;color:#333;font-weight:bold;}#c-%N% a:after{color:inherit;}#c-0{display:block}';
			css = css.replace(/%N%/g, catstyle[cats[cat]]);
			let style = document.createElement('style'); style.type = 'text/css';
			style.appendChild(document.createTextNode(css));
			document.head.appendChild(style);
		}

		let data = this.loadData(db, cat, tag, search, sort, page);
		data.cat = (cat == "") ? "" : "/" + cat;
		data.sort = sort;
		let title;
		if (tag == "") {
			if (search == "") {
				if (cat == "") {
					data.sortname = sortnames[sorts[sort]];
				} else {
					data.sortname = catnames[cats[cat]];
				}
				title = data.sortname;
			} else {
				data.sortname = 'Search Results for "' + search + '"';
				title = search + " :: Search";
			}
		} else {
			data.sortname = 'Search Results for tag "' + tag + '"';
			title = tag + " :: Tag";;
		}
		data.tag = (tag == "") ? (search == "") ? "" : "q=" + search + "&" : "tag=" + tag + "&";
		if (sort == "" || sort == "users") {
			data.tagc = (tag == "") ? (search == "") ? "" : "?q=" + search : "?tag=" + tag;
		} else {
			data.tagc = (tag == "") ? (search == "") ? "?sort=" + sort : "?q=" + search + "&sort=" + sort : "?tag=" + tag + "&sort=" + sort;
		}
		data.srt = ["", "", "", "", "", ""]; 
		data.srt[sorts[sort]] = 'class="selected"';

		document.title = title + " :: Classic Add-ons Archive";
		let template = this.template;
		template = this.processTemplate(template, data);

		let contfrag = document.createRange().createContextualFragment(template);
		let pagediv = document.getElementById("page");
		let frag = contfrag.firstElementChild;
		pagediv.appendChild(frag.children[0]);
		pagediv.appendChild(frag.children[0]);
	},

	loadData: function(db, cat, tag, search, sort, page) {
		let cq1, cq2;
		if (cat != "") {
			cq1 = "INNER JOIN categories ON addons.addon_id = categories.addon_id ";
			cq2 = "cat_name = '" + cat + "' AND ";
		} else {
			cq1 = ""; cq2 = "1 AND ";
		}
		if (tag != "") {
			cq1 += "INNER JOIN tags ON addons.addon_id = tags.addon_id ";
			cq2 += "tag_name = '" + tag + "' AND ";
		} else {
			cq1 += ""; cq2 += "1 AND ";
		}
		if (search != "") {
			cq1 += "";
			cq2 += "addons.name LIKE '%" + search.replace(/'/g, "_") + "%' AND ";
		} else {
			cq1 += ""; cq2 += "1 AND ";
		}
		let cq = cq1 + "WHERE " + cq2.slice(0, -5);

		let dbQuery = db.createStatement("SELECT COUNT(*) AS count FROM addons " + cq);
		dbQuery.executeStep();
		let count = dbQuery.row.count;
		dbQuery.finalize();

		let data = {};
		data.page = count > 0 ? page : 0;
		data.count = new Intl.NumberFormat("en-US").format(count);
		data.pages = Math.ceil(count / 20);
		let pfrom = count > 0 ? (page - 1) * 20 + 1 : 0;
		data.pfrom = new Intl.NumberFormat("en-US").format(pfrom);
		let pto = (pfrom + 19 < count) ? pfrom + 19 : count;
		data.pto = new Intl.NumberFormat("en-US").format(pto);
		if (page == 1) {
			data.disprev = "disabled";
			data.prev = "";
		} else {
			data.disprev = "";
			data.prev = parseInt(page) - 1;
		}
		if (page == data.pages || count == 0) {
			data.disnext = "disabled";
			data.next = "";
		} else {
			data.disnext = "";
			data.next = parseInt(page) + 1;
		}
		let order;
		switch (sort) {
			case "users": order = "users DESC, addons.addon_id"; break;
			case "reviews": order = "reviews DESC, addons.addon_id"; break;
			case "rating": order = "bayesian DESC, addons.addon_id"; break;
			case "created": order = "addons.addon_id DESC"; break;
			case "updated": order = "created DESC, addons.addon_id"; break;
			case "name": order = "name"; break;
		}
		dbQuery = db.createStatement("SELECT addons.addon_id AS addon_id, addons.name AS name, slug, summary, is_experimental, users, reviews, rating, version, is_restart_required, versions.url AS url, min, max, created, icon FROM ( SELECT addons.rowid AS add_row, versions.rowid AS ver_row, MAX(created) AS crt FROM addons INNER JOIN versions ON addons.addon_id = versions.addon_id " + cq + " GROUP BY addons.addon_id ORDER BY " + order + " LIMIT 20 OFFSET :offset ) INNER JOIN versions ON ver_row = versions.rowid INNER JOIN addons ON addons.rowid = add_row LEFT JOIN icons ON addons.addon_id = icons.addon_id");
		dbQuery.params.offset = pfrom - 1;
		data.items = "";
		while (dbQuery.executeStep()) {
			let item = this.item;
			item = item.replace("%NAME%", dbQuery.row.name);
			item = item.replace(/%SLUG%/g, dbQuery.row.slug);
			item = item.replace("%SUMMARY%", dbQuery.row.summary);
			if (dbQuery.row.icon) {
				item = item.replace("%ICON%", "chrome://ca-archive/skin/icons/" + dbQuery.row.icon + ".png");
			} else {
				item = item.replace("%ICON%", "chrome://ca-archive/skin/icons/" + Math.trunc(dbQuery.row.addon_id/1000) + "/" + dbQuery.row.addon_id + ".png");
			}
			let users = new Intl.NumberFormat("en-US").format(dbQuery.row.users);
			item = item.replace("%USERS%", users);
			let reviews = new Intl.NumberFormat("en-US").format(dbQuery.row.reviews);
			item = item.replace("%REVIEWS%", reviews);
			let restart = "";
			if (dbQuery.row.is_restart_required == false) {
				restart = '&nbsp;<span class="no-restart">No Restart</span>';
			}
			item = item.replace("%RESTART%", restart);
			item = item.replace(/%RATING%/g, Math.round(dbQuery.row.rating));
			let experiment = "";
			if (dbQuery.row.is_experimental) {
				experiment = 'caution';
			}
			item = item.replace("%EXPERIMENT%", experiment);
			let appver;
			if (Services.appinfo.name == "Pale Moon") {
				appver = "27.9";
			} else if (Services.appinfo.name != "SeaMonkey") {
				appver = Services.appinfo.version;
			}
			if (appver && Services.vc.compare(dbQuery.row.min, appver) <= 0 && Services.vc.compare(appver, dbQuery.row.max) <= 0) {
				item = item.replace("%COMPAT%", "add");
				item = item.replace("%ACTION%", "Install Now");
				item = item.replace("%DOWNURL%", "https://ca-archive.biz.tm/storage/" + Math.trunc(dbQuery.row.addon_id/1000) + "/" + dbQuery.row.addon_id + "/" + dbQuery.row.url.replace(/^\d+\/(.*)/,"$1") + "?origin=caa&action=install");
			} else {
				item = item.replace("%COMPAT%", "download");
				item = item.replace("%ACTION%", "List Versions");
				item = item.replace("%DOWNURL%", "caa:addon/" + dbQuery.row.slug + "/versions");
			}

			data.items += item;
		}
		dbQuery.finalize();
		return data;
	},

	processTemplate: function(template, data) {
		template = template.replace("%ITEMS%", data.items);
		template = template.replace(/%COUNT%/g, data.count);
		template = template.replace(/%PAGES%/g, data.pages);
		template = template.replace(/%PAGE%/g, data.page);
		template = template.replace("%PFROM%", data.pfrom);
		template = template.replace("%PTO%", data.pto);
		template = template.replace("%PREV%", data.prev);
		template = template.replace("%NEXT%", data.next);
		template = template.replace(/%DISPREV%/g, data.disprev);
		template = template.replace(/%DISNEXT%/g, data.disnext);

		template = template.replace("%SORTNAME%", data.sortname);
		template = template.replace("%SORT0%", data.srt[0]);
		template = template.replace("%SORT1%", data.srt[1]);
		template = template.replace("%SORT2%", data.srt[2]);
		template = template.replace("%SORT3%", data.srt[3]);
		template = template.replace("%SORT4%", data.srt[4]);
		template = template.replace("%SORT5%", data.srt[5]);
		template = template.replace(/%SORT%/g, data.sort);

		template = template.replace(/%CAT%/g, data.cat);
		template = template.replace(/%TAG%/g, data.tag);
		template = template.replace(/%TAGC%/g, data.tagc);

		return template;
	},

	template: `<html>
 <body>
  <div>

    <section class="secondary">
      <nav id="side-nav" class="c" data-addontype="1">
        <h2>Explore</h2>
        <ul id="side-explore">
          <li class="s-users"><em><a href="caa:list?sort=users">Most Popular</a></em></li>
          <li class="s-rating"><em><a href="caa:list?sort=rating">Top Rated</a></em></li>
        </ul>
        <h2>Categories</h2>
        <ul id="side-categories">
          <li id="c-0"><a href="caa:list%TAGC%">All</a></li>
          <li id="c-72"><a href="caa:list/alerts-updates%TAGC%">Alerts &amp; Updates</a></li>
          <li id="c-14"><a href="caa:list/appearance%TAGC%">Appearance</a></li>
          <li id="c-22"><a href="caa:list/bookmarks%TAGC%">Bookmarks</a></li>
          <li id="c-5"><a href="caa:list/download-management%TAGC%">Download Management</a></li>
          <li id="c-1"><a href="caa:list/feeds-news-blogging%TAGC%">Feeds, News &amp; Blogging</a></li>
          <li id="c-142"><a href="caa:list/games-entertainment%TAGC%">Games &amp; Entertainment</a></li>
          <li id="c-37"><a href="caa:list/language-support%TAGC%">Language Support</a></li>
          <li id="c-38"><a href="caa:list/photos-music-videos%TAGC%">Photos, Music &amp; Videos</a></li>
          <li id="c-12"><a href="caa:list/privacy-security%TAGC%">Privacy &amp; Security</a></li>
          <li id="c-13"><a href="caa:list/search-tools%TAGC%">Search Tools</a></li>
          <li id="c-141"><a href="caa:list/shopping%TAGC%">Shopping</a></li>
          <li id="c-71"><a href="caa:list/social-communication%TAGC%">Social &amp; Communication</a></li>
          <li id="c-93"><a href="caa:list/tabs%TAGC%">Tabs</a></li>
          <li id="c-4"><a href="caa:list/web-development%TAGC%">Web Development</a></li>
          <li id="c-73"><a href="caa:list/other%TAGC%">Other</a></li>
        </ul>
      </nav>
    </section>

    <section class="primary">
      <h1>%SORTNAME%</h1>
      <div class="island hero c listing">

        <div id="list-total">%COUNT% items</div>
        <div id="sorter" class="c pjax-trigger">
          <h3>Sort by:</h3>
          <ul>
            <li %SORT0%><a class="opt" href="caa:list%CAT%?%TAG%sort=users">Most Users</a></li>
            <li %SORT1%><a class="opt" href="caa:list%CAT%?%TAG%sort=rating">Top Rated</a></li>
            <li %SORT2%><a class="opt" href="caa:list%CAT%?%TAG%sort=reviews">Most Reviews</a></li>
            <li %SORT3%><a class="opt" href="caa:list%CAT%?%TAG%sort=created">Newest</a></li>
            <li %SORT4%><a class="opt" href="caa:list%CAT%?%TAG%sort=updated">Recently Updated</a></li>
            <li %SORT5%><a class="opt" href="caa:list%CAT%?%TAG%sort=name">Name</a></li>
          </ul>
        </div>

        <div class="items">
          %ITEMS%
        </div> <!-- items -->

        <nav class="paginator c pjax-trigger">
          <p class="num">Page <a href="caa:list%CAT%?%TAG%sort=%SORT%&page=%PAGE%">%PAGE%</a> of <a href="caa:list%CAT%?%TAG%sort=%SORT%&page=%PAGES%">%PAGES%</a></p>
          <p class="rel">
            <a href="caa:list%CAT%?%TAG%sort=%SORT%&page=1" title="Jump to first page" class="jump %DISPREV%">&#9666;&#9666;</a>
            <a href="caa:list%CAT%?%TAG%sort=%SORT%&page=%PREV%" class="button prev %DISPREV%">&#9666; Previous</a>
            <a href="caa:list%CAT%?%TAG%sort=%SORT%&page=%NEXT%" class="button next %DISNEXT%">Next &#9656;</a>
            <a href="caa:list%CAT%?%TAG%sort=%SORT%&page=%PAGES%" title="Jump to last page" class="jump %DISNEXT%">&#9656;&#9656;</a>
          </p>
          <p class="pos">Showing <b>%PFROM%</b>&#8211;<b>%PTO%</b> of <b>%COUNT%</b></p>
        </nav>

      </div>
    </section>

  </div>
 </body>
</html>`,

	item: `
          <div class="item addon">
            <div class="info">
              <h3>
                <a href="caa:addon/%SLUG%"><img src="%ICON%" alt="">%NAME%</a>
                %RESTART%
              </h3>
              <p class="desc">%SUMMARY%</p>
              <div class="vitals c">
                <span class="rating">
                  <span class="stars stars-%RATING%" title="Rated %RATING% out of 5 stars">Rated %RATING% out of 5 stars</span>
                  <a href="caa:addon/%SLUG%">(%REVIEWS%)</a>
                </span>
                <div class="adu">%USERS% users</div>
              </div>
            </div>
            <div class="action">
              <div class="install-shell">
                <div class="install clickHijack">
                  <p class="install-button">
                    <a class="button %EXPERIMENT% %COMPAT%" href="%DOWNURL%">
                      <b></b>
                      <span>%ACTION%</span>
                    </a>
                  </p>
                </div>
                <div class="d2c-reasons-popup popup">
                  <p>This add-on is not compatible with your version of Firefox because of the following:</p>
                  <ul></ul>
                </div>
                <p><a id="downloadAnyway" hidden="true">Download Anyway</a></p>
              </div> 
            </div>
          </div>`

};