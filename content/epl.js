"use strict";
let EXPORTED_SYMBOLS = ["EPL"];

let EPL = {

	showPage: function(document, db, query, type, ver) {
		let data = this.loadData(db, query, type, ver);
		let template = this.template;
		template = this.processTemplate(template, data);
		document.title = data.type + " for " + data.name + " :: Classic Add-ons Archive";

		let contfrag = document.createRange().createContextualFragment(template);
		let page = document.getElementById("page");
		let frag = contfrag.firstElementChild;
		page.appendChild(frag);
	},

	loadData: function(db, query, type, ver) {
		let col;
		if (/^\d+$/.test(query)) {
			col = "addon_id";
		} else {
			col = "slug";
		}
		let dbQuery;
		if (type == "eula") {
			dbQuery = db.createStatement("SELECT addons.name AS name, slug, eulas.text AS eula FROM addons LEFT JOIN eulas ON eulas.addon_id = addons.addon_id WHERE addons." + col + " = :query");
		} else if (type == "privacy") {
			dbQuery = db.createStatement("SELECT addons.name AS name, slug, policies.text AS policy FROM addons LEFT JOIN policies ON policies.addon_id = addons.addon_id WHERE addons." + col + " = :query");
		} else {
			dbQuery = db.createStatement("SELECT addons.name AS name, slug, version, licenses.name AS lic_name, licenses.text AS lic_text FROM addons INNER JOIN versions ON addons.addon_id = versions.addon_id LEFT JOIN licenses ON licenses.license_id = versions.license_id WHERE addons." + col + " = :query AND versions.version = :version LIMIT 1");
			dbQuery.params.version = ver;
		}
		dbQuery.params.query = query;
		let data = {};
		dbQuery.executeStep();
		data.name = dbQuery.row.name;
		data.slug = dbQuery.row.slug;
		if (type == "eula") {
			data.content = dbQuery.row.eula.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;");
			data.type = "End-User License Agreement";
			data.version = ""; data.licname = "";
		} else if (type == "privacy") {
			data.content = dbQuery.row.policy.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;");
			data.type = "Privacy Policy";
			data.version = ""; data.licname = "";
		} else {
			data.content = dbQuery.row.lic_text.replace(/(?:\r\n|\r|\n)/g, "<br>").replace("$", "&#36;");
			data.version = '<span class="version">' + dbQuery.row.version + '</span>';
			data.type = "Source Code License";
			data.licname = "<h3>" + dbQuery.row.lic_name + "</h3>";
		}

		dbQuery.finalize();
		return data;
	},

	processTemplate: function(template, data) {
		template = template.replace(/%NAME%/g, data.name);
		template = template.replace("%VERSION%", data.version);
		template = template.replace("%TYPE%", data.type);
		template = template.replace("%LICNAME%", data.licname);
		template = template.replace("%SLUG%", data.slug);
		template = template.replace("%CONTENT%", data.content);
		return template;
	},

	template: `<html>
 <body>

    <section class="primary2">
      <hgroup class="hero">
        <h1>%NAME% %VERSION%</h1>
      </hgroup>
      <div class="prose">
        <h2>%TYPE%</h2>
        %LICNAME%
        <div class="policy-statement">%CONTENT%</div>
        <p class="policy-back"><a href="caa:addon/%SLUG%">Back to %NAME%&hellip;</a></p>
      </div>
    </section>

 </body>
</html>`

};