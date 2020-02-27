"use strict";
let EXPORTED_SYMBOLS = ["Versions"];

var Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

let Versions = {

	showPage: function(document, db, query, page) {
		document.body.className += " gutter versions";
		if (page === undefined) {
			page = 1;
		}
		let data = this.loadData(db, query, page);
		document.title = data.name + " :: Versions :: Classic Add-ons Archive";
		let template = this.template;
		template = this.processTemplate(template, data);

		let contfrag = document.createRange().createContextualFragment(template);
		let pagediv = document.getElementById("page");
		let frag = contfrag.firstElementChild;
		pagediv.appendChild(frag);
	},

	loadData: function(db, query, page) {
		let col;
		if (/^\d+$/.test(query)) {
			col = "addon_id";
		} else {
			col = "slug";
		}
		let data = {};
		let dbQuery = db.createStatement("SELECT COUNT(*) as count, addons.name AS name, slug FROM addons INNER JOIN versions ON addons.addon_id = versions.addon_id WHERE addons." + col + " = :query");
		dbQuery.params.query = query;
		dbQuery.executeStep();
		data.name = dbQuery.row.name;
		data.slug = dbQuery.row.slug;
		let count = dbQuery.row.count;
		dbQuery.finalize();

		data.page = page;
		data.count = new Intl.NumberFormat("en-US").format(count);
		data.pages = Math.ceil(count / 30);
		let pfrom = (page - 1) * 30 + 1;
		data.pfrom = new Intl.NumberFormat("en-US").format(pfrom);
		let pto = (pfrom + 29 < count) ? pfrom + 29 : count;
		data.pto = new Intl.NumberFormat("en-US").format(pto);
		if (page == 1) {
			data.disprev = "disabled";
			data.prev = "";
		} else {
			data.disprev = "";
			data.prev = parseInt(page) - 1;
		}
		if (page == data.pages) {
			data.disnext = "disabled";
			data.next = "";
		} else {
			data.disnext = "";
			data.next = parseInt(page) + 1;
		}

		dbQuery = db.createStatement("SELECT addons.addon_id AS addon_id, is_experimental, version, platform, release_notes, is_restart_required, versions.url AS url, min, max, size, created, licenses.name AS lic_name, licenses.url AS lic_url FROM addons INNER JOIN versions ON addons.addon_id = versions.addon_id LEFT JOIN licenses ON licenses.license_id = versions.license_id WHERE addons." + col + " = :query ORDER BY created DESC LIMIT 30 OFFSET :offset");
		dbQuery.params.query = query;
		dbQuery.params.offset = pfrom - 1;
		data.items = "";
		while (dbQuery.executeStep()) {
			let item = this.item;
			let experiment = "";
			if (dbQuery.row.is_experimental) {
				experiment = 'caution';
			}
			item = item.replace("%EXPERIMENT%", experiment);
			let platform = "";
			if (dbQuery.row.platform != "" && dbQuery.row.platform != "all") {
				platform = " (" + dbQuery.row.platform + ")";
			}
			item = item.replace(/%VERSION%/g, dbQuery.row.version + platform);
			item = item.replace("%RELNOTE%", dbQuery.row.release_notes.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;"));
			let restart = "";
			if (dbQuery.row.is_restart_required == false) {
				restart = '&nbsp;<span class="no-restart">No Restart</span>';
			}
			item = item.replace("%RESTART%", restart);
			item = item.replace("%MIN%", dbQuery.row.min);
			item = item.replace("%MAX%", dbQuery.row.max);
			let size, nBytes = dbQuery.row.size;
			for (let aMultiples = ["KiB", "MiB", "GiB"], nMultiple = 0, nApprox = nBytes / 1024; 
					nApprox > 1; nApprox /= 1024, nMultiple++) {
				size = nApprox.toFixed(1) + " " + aMultiples[nMultiple];
			};
			item = item.replace("%SIZE%", size);
			let created = new Date(dbQuery.row.created*1000);
			item = item.replace("%RELDATE%", created.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}));
			let license;
			if (dbQuery.row.lic_url !== null) {
				let lic_url, target;
				if (dbQuery.row.lic_url != "") {
					lic_url = dbQuery.row.lic_url;
					target = 'target="_blank"';
				} else {
					lic_url = "caa:addon/" + data.slug + "/license/" + dbQuery.row.version;
					target = '';
				}
				license = '<ul class="source"><li>Source code released under <a ' + target + ' href="' + lic_url + '">' + dbQuery.row.lic_name + '</a></li></ul>'; 
			} else {
				license = "";
			}
			item = item.replace("%LICENSE%", license);
			let appver;
			if (Services.appinfo.name == "Pale Moon") {
				appver = "27.9";
			} else if (Services.appinfo.name != "SeaMonkey" && Services.appinfo.name != "Iceape-UXP") {
				appver = Services.appinfo.version;
			}
			let downurl = "https://ca-archive.biz.tm/storage/" + Math.trunc(dbQuery.row.addon_id/1000) + "/" + dbQuery.row.addon_id + "/" + dbQuery.row.url.replace(/^\d+\/(.*)/,"$1") + "?origin=caa&action=";
			if (appver && Services.vc.compare(dbQuery.row.min, appver) <= 0 && Services.vc.compare(appver, dbQuery.row.max) <= 0) {
				item = item.replace("%COMPAT%", "add");
				item = item.replace("%ACTION%", "Install Now");
				downurl += "install";
			} else {
				item = item.replace("%COMPAT%", "download");
				item = item.replace("%ACTION%", "Download");
				downurl += "download";
			}
			item = item.replace("%DOWNURL%", downurl);

			data.items += item;
		}
		dbQuery.finalize();
		return data;
	},

	processTemplate: function(template, data) {
		template = template.replace("%ITEMS%", data.items);
		template = template.replace(/%NAME%/g, data.name);
		template = template.replace(/%SLUG%/g, data.slug);
		template = template.replace(/%COUNT%/g, data.count);
		template = template.replace(/%PAGES%/g, data.pages);
		template = template.replace(/%PAGE%/g, data.page);
		template = template.replace("%PFROM%", data.pfrom);
		template = template.replace("%PTO%", data.pto);
		template = template.replace("%PREV%", data.prev);
		template = template.replace("%NEXT%", data.next);
		template = template.replace(/%DISPREV%/g, data.disprev);
		template = template.replace(/%DISNEXT%/g, data.disnext);
		return template;
	},

	template: `<html>
 <body>

    <section class="primary">
      <header>
        <hgroup>
          <h1>%NAME% Version History</h1>
          <h3><b>%COUNT%</b> versions</h3>
        </hgroup>
      </header>

      <div class="island hero c listing">
        <div class="warning highlight">
          <span><b>Be careful with old versions!</b> You should always prefer the <a href="caa:addon/%SLUG%">latest version</a> of an add-on.</span>
        </div>
        <div class="items">
          %ITEMS%
        </div>

        <nav class="paginator c pjax-trigger">
          <p class="num">Page <a href="caa:addon/%SLUG%/versions/?page=%PAGE%">%PAGE%</a> of <a href="caa:addon/%SLUG%/versions/?page=%PAGES%">%PAGES%</a></p>
          <p class="rel">
            <a href="caa:addon/%SLUG%/versions/?page=1" title="Jump to first page" class="jump %DISPREV%">&#9666;&#9666;</a>
            <a href="caa:addon/%SLUG%/versions/?page=%PREV%" class="button prev %DISPREV%">&#9666; Previous</a>
            <a href="caa:addon/%SLUG%/versions/?page=%NEXT%" class="button next %DISNEXT%">Next &#9656;</a>
            <a href="caa:addon/%SLUG%/versions/?page=%PAGES%" title="Jump to last page" class="jump %DISNEXT%">&#9656;&#9656;</a>
          </p>
          <p class="pos">Showing <b>%PFROM%</b>&#8211;<b>%PTO%</b> of <b>%COUNT%</b></p>
        </nav>

      </div>
    </section>

 </body>
</html>`,

	item: `
              <div class="version item" id="version-%VERSION%">
                <div class="info">
                  <h3>
                    <a href="caa:addon/%SLUG%/versions?page=%PAGE%#version-%VERSION%" title="Link to this version">Version %VERSION%</a>
                    <span class="meta">
                      <time>Released %RELDATE%</time>
                      <span class="filesize">%SIZE%</span>
                    </span>
                    <span class="meta compat">Works with Firefox %MIN% - %MAX%</span>
                  </h3>
                  <div class="desc prose">%RELNOTE%</div>
                  %LICENSE%
                </div>
                <div class="action">
                  <div class="install-shell">
                    <div class="install">
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
