"use strict";
let EXPORTED_SYMBOLS = ["About"];

let About = {

	showPage: function(document, db) {
		let data = this.loadData(db);
		let template = this.template;
		template = this.processTemplate(template, data);
		document.title = "About :: Classic Add-ons Archive";

		let contfrag = document.createRange().createContextualFragment(template);
		let page = document.getElementById("page");
		let frag = contfrag.firstElementChild;
		page.appendChild(frag);
	},

	loadData: function(db) {
		let data = {};
		let dbQuery = db.createStatement("SELECT COUNT(*) AS versions FROM versions");
		dbQuery.executeStep();
		data.versions = new Intl.NumberFormat("en-US").format(dbQuery.row.versions);
		dbQuery.finalize();

		dbQuery = db.createStatement("SELECT COUNT(*) AS addons FROM addons");
		dbQuery.executeStep();
		data.addons = new Intl.NumberFormat("en-US").format(dbQuery.row.addons);
		dbQuery.finalize();

		dbQuery = db.createStatement("SELECT COUNT(*) AS authors FROM authors");
		dbQuery.executeStep();
		data.authors = new Intl.NumberFormat("en-US").format(dbQuery.row.authors);
		dbQuery.finalize();

		return data;
	},

	processTemplate: function(template, data) {
		template = template.replace("%VERSIONS%", data.versions);
		template = template.replace("%ADDONS%", data.addons);
		template = template.replace("%AUTHORS%", data.authors);
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
          <li id="c-0"><a href="caa:list">All</a></li>
          <li id="c-72"><a href="caa:list/alerts-updates">Alerts &amp; Updates</a></li>
          <li id="c-14"><a href="caa:list/appearance">Appearance</a></li>
          <li id="c-22"><a href="caa:list/bookmarks">Bookmarks</a></li>
          <li id="c-5"><a href="caa:list/download-management">Download Management</a></li>
          <li id="c-1"><a href="caa:list/feeds-news-blogging">Feeds, News &amp; Blogging</a></li>
          <li id="c-142"><a href="caa:list/games-entertainment">Games &amp; Entertainment</a></li>
          <li id="c-37"><a href="caa:list/language-support">Language Support</a></li>
          <li id="c-38"><a href="caa:list/photos-music-videos">Photos, Music &amp; Videos</a></li>
          <li id="c-12"><a href="caa:list/privacy-security">Privacy &amp; Security</a></li>
          <li id="c-13"><a href="caa:list/search-tools">Search Tools</a></li>
          <li id="c-141"><a href="caa:list/shopping">Shopping</a></li>
          <li id="c-71"><a href="caa:list/social-communication">Social &amp; Communication</a></li>
          <li id="c-93"><a href="caa:list/tabs">Tabs</a></li>
          <li id="c-4"><a href="caa:list/web-development">Web Development</a></li>
          <li id="c-73"><a href="caa:list/other">Other</a></li>
        </ul>
      </nav>
    </section>

    <section class="primary">
      <h1>Classic Add-ons Archive</h1>
      <div class="island hero c listing">

        <div class="about-home">
          <h2>About</h2>
          <p>This catalog contains <b>%VERSIONS%</b> versions of <b>%ADDONS%</b> Firefox add-ons created by <b>%AUTHORS%</b> developers over the past <b>15&nbsp;years</b> using XUL/XPCOM technology before Mozilla decided to ruin the classic extensions ecosystem and go exclusively to WebExtensions.</p>
          <h2>Who creates these add-ons?</h2>
          <p>The add-ons listed here have been created by a wide range of developers from individual hobbyists to large corporations and were reviewed by a team of AMO editors before being released. Add-ons marked as Experimental have not been reviewed and should be installed with caution.</p>
          <h2>The source of data</h2>
          <p>All the data contained in this catalog was obtained from publicly available sources such as <a target="_blank" href="https://addons.mozilla.org">AMO</a>, <a target="_blank" href="http://web.archive.org/">Wayback Machine</a> and other open Internet directories and collections. Cloud storage is kindly provided by <a target="_blank" href="https://www.waterfoxproject.org/">Waterfox Project</a>.</p>
          <h2>Legal notices</h2>
          <p>Except as noted below, <a target="_blank" href="https://github.com/JustOff/ca-archive">this catalog</a> is released under <a target="_blank" href="http://www.mozilla.org/MPL/2.0/">Mozilla Public License, version 2.0</a>. The design is based on AMO website by <a target="_blank" href="https://www.mozilla.org">Mozilla</a> and adapted by JustOff under <a target="_blank" href="http://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA-3.0</a>. All product names, logos and brands are property of their respective owners, specific licenses are indicated in the description of each add-on. All company, product and service names used in this catalog are for identification purposes only.</p>
        </div>

      </div>
    </section>

  </div>
 </body>
</html>`

};