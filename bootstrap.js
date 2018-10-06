"use strict";
var {classes: Cc, interfaces: Ci, manager: Cm, results: Cr, Constructor: CC, utils: Cu} = Components;
Cm.QueryInterface(Ci.nsIComponentRegistrar);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const SCHEME = "caa";
const CAA_URL ="chrome://ca-archive/content/ca-archive.html";
const CAA_URI = Services.io.newURI(CAA_URL, null, null);

const nsIURI = CC("@mozilla.org/network/simple-uri;1", "nsIURI");
const ff47plus = (Services.vc.compare(Services.appinfo.version, 47) > 0);

const CAA_MODULES = [
	"chrome://ca-archive/content/about.js",
	"chrome://ca-archive/content/addon.js",
	"chrome://ca-archive/content/db.js",
	"chrome://ca-archive/content/epl.js",
	"chrome://ca-archive/content/list.js",
	"chrome://ca-archive/content/tcloud.js",
	"chrome://ca-archive/content/versions.js"
];

let factory, storageHost, gWindowListener = null, branch = "extensions.ca-archive.";

let styleSheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
let styleSheetURI = Services.io.newURI("chrome://ca-archive/skin/button.css", null, null);

function $(node, childId) {
	if (node.getElementById) {
		return node.getElementById(childId);
	} else {
		return node.querySelector("#" + childId);
	}
}

let button = {
	meta : {
		id : "ca-archive-button",
		label : "Classic Add-ons Archive",
		tooltiptext : "Classic Add-ons Archive",
		class : "toolbarbutton-1 chromeclass-toolbar-additional"
	},
	install : function (w) {
		let doc = w.document;
		let b = doc.createElement("toolbarbutton");
		for (let a in this.meta) {
			b.setAttribute(a, this.meta[a]);
		}
		b.style.listStyleImage = 'url("chrome://ca-archive/skin/button.png")';

		let toolbox = $(doc, "navigator-toolbox");
		toolbox.palette.appendChild(b);

		let {toolbarId, nextItemId} = this.getPrefs(),
			toolbar = toolbarId && $(doc, toolbarId),
			nextItem = toolbar && $(doc, nextItemId);
		if (toolbar) {
			if (nextItem && nextItem.parentNode && nextItem.parentNode.id.replace("-customization-target", "") == toolbarId) {
				toolbar.insertItem(this.meta.id, nextItem);
			} else {
				let ids = (toolbar.getAttribute("currentset") || "").split(",");
				nextItem = null;
				for (let i = ids.indexOf(this.meta.id) + 1; i > 0 && i < ids.length; i++) {
					nextItem = $(doc, ids[i])
					if (nextItem) {
						break;
					}
				}
				toolbar.insertItem(this.meta.id, nextItem);
			}
			if (toolbar.getAttribute("collapsed") == "true") {
				try { w.setToolbarVisibility(toolbar, true); } catch(e) {}
			}
		}
		return b;
	},
	onCustomize : function(e) {
		try {
			let ucs = Services.prefs.getCharPref("browser.uiCustomization.state");
			if ((/\"nav\-bar\"\:\[.*?\"ca\-archive\-button\".*?\]/).test(ucs)) {
				Services.prefs.getBranch(branch).setCharPref("toolbarId", "nav-bar");
			} else {
				button.setPrefs(null, null);
			}
		} catch(e) {}
	},
	afterCustomize : function (e) {
		let toolbox = e.target,
			b = $(toolbox.parentNode, button.meta.id),
			toolbarId, nextItemId;
		if (b) {
			let parent = b.parentNode,
				nextItem = b.nextSibling;
			if (parent && (parent.localName == "toolbar" || parent.classList.contains("customization-target"))) {
				toolbarId = parent.id;
				nextItemId = nextItem && nextItem.id;
			}
		}
		button.setPrefs(toolbarId, nextItemId);
	},
	getPrefs : function () {
		let p = Services.prefs.getBranch(branch);
		return {
			toolbarId : p.getCharPref("bar"),
			nextItemId : p.getCharPref("before")
		};
	},
	setPrefs : function (toolbarId, nextItemId) {
		let p = Services.prefs.getBranch(branch);
		p.setCharPref("bar", toolbarId == "nav-bar-customization-target" ? "nav-bar" : toolbarId || "");
		p.setCharPref("before", nextItemId || "");
	}
};

let menuitem = {
	meta : {
		id : "ca-archive-menu",
		label : "Classic Add-ons Archive",
		class : "menuitem-iconic"
	},
	install : function (w) {
		let doc = w.document;
		let m = doc.createElement("menuitem");
		for (let a in this.meta) {
			m.setAttribute(a, this.meta[a]);
		}
		m.style.listStyleImage = 'url("chrome://ca-archive/skin/button.png")';

		let menu;
		if (Services.appinfo.name == "SeaMonkey") {
			menu = $(doc, "taskPopup");
		} else {
			menu = $(doc, "menu_ToolsPopup");
		}
		menu.insertBefore(m, null);
		return m;
	}
};

let caaIn = function (w) {
	let b = button.install(w);
	let m = menuitem.install(w);

	return {
		init : function () {
			w.addEventListener("customizationchange", button.onCustomize, false);
			w.addEventListener("aftercustomization", button.afterCustomize, false);
			b.addEventListener("command", this.run, false);
			m.addEventListener("command", this.run, false);
		},
		done : function () {
			w.removeEventListener("customizationchange", button.onCustomize, false);
			w.removeEventListener("aftercustomization", button.afterCustomize, false);
			b.removeEventListener("command", this.run, false);
			b.parentNode.removeChild(b);
			b = null;
			m.removeEventListener("command", this.run, false);
			m.parentNode.removeChild(m);
			m = null;
		},
		run : function () {
			if (Services.ppmm.childCount > 1) {
				Services.prompt.alert(null, "Classic Add-ons Archive", "Multi-process mode is not supported now,\nplease disable it and restart the browser.");
				return;
			}
			let isOpen = false;
			let winenu = Services.wm.getEnumerator("navigator:browser");
			loop: while (winenu.hasMoreElements()) {
				let window = winenu.getNext().QueryInterface(Ci.nsIDOMWindow);
				for (let tab of window.gBrowser.tabs) {
					if (tab.linkedBrowser.currentURI.scheme == "caa") {
						window.focus()
						window.gBrowser.selectedTab = tab;
						isOpen = true;
						break loop;
					}
				}
			}
			if (!isOpen) {
				let mrw = Services.wm.getMostRecentWindow("navigator:browser");
				let url = Services.prefs.getBranch(branch).getCharPref("url");
				mrw.gBrowser.selectedTab = mrw.gBrowser.addTab(url);
				if (url == "caa:about") {
					Services.prefs.getBranch(branch).setCharPref("url", "caa:");
				}
			}
		}
	};
};

function BrowserWindowObserver(handlers) {
	this.handlers = handlers;
}

BrowserWindowObserver.prototype = {
	observe: function (aSubject, aTopic, aData) {
		if (aTopic == "domwindowopened") {
			aSubject.QueryInterface(Ci.nsIDOMWindow).addEventListener("load", this, false);
		} else if (aTopic == "domwindowclosed") {
			if (aSubject.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
				this.handlers.onShutdown(aSubject);
			}
		}
	},
	handleEvent: function (aEvent) {
		let aWindow = aEvent.currentTarget;
		aWindow.removeEventListener(aEvent.type, this, false);

		if (aWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
			this.handlers.onStartup(aWindow);
		}
	}
};

function browserWindowStartup (aWindow) {
	aWindow["ca-archive"] = caaIn(aWindow);
	aWindow["ca-archive"].init()
}

function browserWindowShutdown (aWindow) {
	aWindow["ca-archive"].done();
	delete aWindow["ca-archive"];
}

function CAAProtocolHandler() {}

CAAProtocolHandler.prototype = Object.freeze({
	classDescription: "CAA Protocol Handler",
	contractID: "@mozilla.org/network/protocol;1?name=" + SCHEME,
	classID: Components.ID('{f0700cf0-b198-11e7-8f1a-0800200c9a66}'),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler]),

	scheme: SCHEME,
	defaultPort: -1,

	allowPort: function(port, scheme) {
		return false;
	},

	protocolFlags: Ci.nsIProtocolHandler.URI_NORELATIVE |
				   Ci.nsIProtocolHandler.URI_NOAUTH |
				   Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE |
				   Ci.nsIProtocolHandler.URI_IS_LOCAL_RESOURCE |
				   Ci.nsIProtocolHandler.URI_OPENING_EXECUTES_SCRIPT,

	newURI: function(aSpec, aOriginCharset, aBaseURI) {
		if (aBaseURI && aBaseURI.scheme == SCHEME) {
			if (aSpec != "/") {
				return Services.io.newURI(aSpec, aOriginCharset, CAA_URI);
			} else {
				return CAA_URI;
			}
		}

		let rv = new nsIURI();
		rv.spec = aSpec;
		return rv;
	},

	newChannel: function(aURI) {
		return this.newChannel2(aURI, null);
	},

	newChannel2: function(aURI, aSecurity_or_aLoadInfo) {
		let channel;
		if (aSecurity_or_aLoadInfo || ff47plus) {
			let uri = Services.io.newURI(CAA_URL, null, null);
			channel = Services.io.newChannelFromURIWithLoadInfo(uri, aSecurity_or_aLoadInfo);
		} else {
			channel = Services.io.newChannel(CAA_URL, null, null);
		}
		channel.originalURI = aURI;
		return channel;
	}
});

function Factory(component) {
	this.createInstance = function(outer, iid) {
		if (outer) {
			throw Cr.NS_ERROR_NO_AGGREGATION;
		}
		return new component();
	};
	this.register = function() {
		Cm.registerFactory(component.prototype.classID, component.prototype.classDescription, component.prototype.contractID, this);
	};
	this.unregister = function() {
		Cm.unregisterFactory(component.prototype.classID, this);
	};
	Object.freeze(this);
	this.register();
}

let httpObserver = {
	observe: function(subject, topic, data) {
		if (topic == "http-on-examine-response" || topic == "http-on-examine-cached-response") {
			subject.QueryInterface(Ci.nsIHttpChannel);
			if (subject.URI.host == storageHost) {
				if (/origin=caa&action=install$/.test(subject.URI.path)) {
					subject.setResponseHeader("Content-Disposition", "", false);
				} else if (/origin=caa&action=download$/.test(subject.URI.path)) {
					subject.setResponseHeader("Content-Disposition", "attachment", false);
				}
			} else if (subject.URI.host == "ca-archive.biz.tm") {
				if (subject.responseStatus == "302" && /^\/storage\//.test(subject.URI.path)) {
					let redirect;
					if ((redirect = /^https?:\/\/(.+?)\//.exec(subject.getResponseHeader("Location"))) !== null) {
						storageHost = redirect[1];
					}
				}
			}
		}
	},
	QueryInterface: function(aIID) {
		if (aIID.equals(Ci.nsIObserver) || aIID.equals(Ci.nsISupports)) {
			return this;
		} else {
			throw Cr.NS_NOINTERFACE;
		}
	},
	register: function() {
		Services.obs.addObserver(this, "http-on-examine-response", false);
		Services.obs.addObserver(this, "http-on-examine-cached-response", false);
	},
	unregister: function() {
		Services.obs.removeObserver(this, "http-on-examine-response");
		Services.obs.removeObserver(this, "http-on-examine-cached-response");
	}
}

function startup(data, reason) {
	if (!styleSheetService.sheetRegistered(styleSheetURI, styleSheetService.USER_SHEET)) {
		styleSheetService.loadAndRegisterSheet(styleSheetURI, styleSheetService.USER_SHEET);
	}

	factory = new Factory(CAAProtocolHandler);

	let defaultBranch = Services.prefs.getDefaultBranch(branch);
	defaultBranch.setCharPref("bar", "nav-bar");
	defaultBranch.setCharPref("before", "");
	defaultBranch.setCharPref("url", "caa:about");

	httpObserver.register();

	gWindowListener = new BrowserWindowObserver({
		onStartup: browserWindowStartup,
		onShutdown: browserWindowShutdown
	});
	Services.ww.registerNotification(gWindowListener);
	
	let winenu = Services.wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowStartup(winenu.getNext());
	}
}

function shutdown(data, reason) {
	if (reason == APP_SHUTDOWN) return;

	Services.ww.unregisterNotification(gWindowListener);
	gWindowListener = null;

	httpObserver.unregister();

	let winenu = Services.wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowShutdown(winenu.getNext());
	}

	factory.unregister();
	if (reason == ADDON_UNINSTALL) {
		try {
			let dir = Services.dirsvc.get("ProfD", Ci.nsIFile); dir.append("ca-archive");
			if (dir.exists()) {
				dir.remove(true);
			}
		} catch (e) {}
	}

	if (styleSheetService.sheetRegistered(styleSheetURI, styleSheetService.USER_SHEET)) {
		styleSheetService.unregisterSheet(styleSheetURI, styleSheetService.USER_SHEET);
	}

	CAA_MODULES.forEach(Cu.unload, Cu);
}

function install(data, reason) {}
function uninstall(data, reason) {}
