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
const hint = '<h3>Try to find "<font color="#003986">%ADDON%</font>" in the <a href="caa:addon/%ADDON%">Classic Add-ons Archive</a>.</h3>';

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
			toolbar = toolbarId && $(doc, toolbarId);
		if (toolbar) {
			// Handle special items with dynamic ids
			let match = /^(separator|spacer|spring)\[(\d+)\]$/.exec(nextItemId);
			if (match !== null) {
				let dynItems = toolbar.querySelectorAll("toolbar" + match[1]);
				if (match[2] < dynItems.length) {
					nextItemId = dynItems[match[2]].id;
				}
			}
			let nextItem = nextItemId && $(doc, nextItemId);
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
			toolbarId, nextItem, nextItemId;
		if (b) {
			let parent = b.parentNode;
			nextItem = b.nextSibling;
			if (parent && (parent.localName == "toolbar" || parent.classList.contains("customization-target"))) {
				toolbarId = parent.id;
				nextItemId = nextItem && nextItem.id;
			}
		}
		// Handle special items with dynamic ids
		let match = /^(separator|spacer|spring)\d+$/.exec(nextItemId);
		if (match !== null) {
			let dynItems = nextItem.parentNode.querySelectorAll("toolbar" + match[1]);
			for (let i = 0; i < dynItems.length; i++) {
				if (dynItems[i].id == nextItemId) {
					nextItemId = match[1] + "[" + i + "]";
					break;
				}
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
			function isRemote (win) {
				let loadContext = win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsILoadContext);
				return loadContext.useRemoteTabs;
			}
			let e10s = isRemote(Services.wm.getMostRecentWindow("navigator:browser"));
			if (e10s && Services.appinfo.name != "Waterfox") {
				Services.prompt.alert(null, "Classic Add-ons Archive", "Multi-process mode is not supported now,\nplease disable it and restart " + Services.appinfo.name + ".");
				return;
			}
			let isOpen = false, ne10win = null;
			let winenu = Services.wm.getEnumerator("navigator:browser");
			loop: while (winenu.hasMoreElements()) {
				let window = winenu.getNext().QueryInterface(Ci.nsIDOMWindow);
				for (let tab of window.gBrowser.tabs) {
					if (tab.linkedBrowser.currentURI.scheme == "caa") {
						window.focus();
						window.gBrowser.selectedTab = tab;
						isOpen = true;
						break loop;
					}
				}
				if (e10s && ne10win === null) {
					if (!isRemote(window)) {
						ne10win = window;
					}
				}
			}
			if (!isOpen) {
				let mrw = Services.wm.getMostRecentWindow("navigator:browser");
				let url = Services.prefs.getBranch(branch).getCharPref("url");
				if (!e10s) {
					mrw.gBrowser.selectedTab = mrw.gBrowser.addTab(url);
				} else {
					if (ne10win === null) {
						mrw.openDialog("chrome://browser/content/", "_blank", "chrome,all,dialog=no,non-remote", url);
					} else {
						ne10win.focus();
						ne10win.gBrowser.selectedTab = ne10win.gBrowser.addTab(url);
					}
				}
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
		if (topic == "http-on-modify-request") {
			subject.QueryInterface(Ci.nsIHttpChannel);
			if (subject.URI.host == "web.archive.org") {
				if (/^\/web\/.+?\/(addons\.mozilla\.org\/.+?\/more|addons\.cdn\.mozilla\.net\/.+?\/loading-more\.gif.*?|addons-amo\.cdn\.mozilla\.net\/amo-.+?\.js)$/.test(subject.URI.path)) {
					subject.cancel(Cr.NS_BINDING_ABORTED);
				}
			}
		} else if (topic == "http-on-examine-response" || topic == "http-on-examine-cached-response") {
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
			} else if (subject.URI.host == "addons.mozilla.org" && !Services.appinfo.browserTabsRemoteAutostart) {
				let addon;
				if (subject.responseStatus == "404" && (addon = /\/firefox\/addon\/(.*?)\//.exec(subject.URI.path)) !== null) {
					subject.QueryInterface(Ci.nsITraceableChannel);
					let newListener = new TracingListener();
					newListener.addon = addon[1];
					newListener.originalListener = subject.setNewListener(newListener);
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
		Services.obs.addObserver(this, "http-on-modify-request", false);
		Services.obs.addObserver(this, "http-on-examine-response", false);
		Services.obs.addObserver(this, "http-on-examine-cached-response", false);
	},
	unregister: function() {
		Services.obs.removeObserver(this, "http-on-modify-request");
		Services.obs.removeObserver(this, "http-on-examine-response");
		Services.obs.removeObserver(this, "http-on-examine-cached-response");
	}
}

function CCIN(cName, ifaceName) {
	return Cc[cName].createInstance(Ci[ifaceName]);
}

function TracingListener() {
	this.receivedData = [];
}

TracingListener.prototype = {
	onDataAvailable: function(request, context, inputStream, offset, count) {
		let binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1","nsIBinaryInputStream");
		binaryInputStream.setInputStream(inputStream);
		let data = binaryInputStream.readBytes(count);
		this.receivedData.push(data);
	},
	onStartRequest: function(request, context) {
		try {
			this.originalListener.onStartRequest(request, context);
		} catch (err) {
			request.cancel(err.result);
		}
	},
	onStopRequest: function(request, context, statusCode) {
		let data = this.receivedData.join("");
		try {
			data = data.replace(/<div class="Card-contents">/, "$&" + hint.replace(/%ADDON%/g, this.addon));
			data = data.replace(/<script[\s\S]+ integrity="[\s\S]+?<\/script>/g, "");
		} catch (e) {}

		let storageStream = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
		storageStream.init(8192, data.length, null);
		let os = storageStream.getOutputStream(0);
		if (data.length > 0) {
			os.write(data, data.length);
		}
		os.close();

		try {
			this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, data.length);
		} catch (e) {}

		try {
			this.originalListener.onStopRequest(request, context, statusCode);
		} catch (e) {}
	},
	QueryInterface: function(aIID) {
		if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
			return this;
		} else {
			throw Cr.NS_NOINTERFACE;
		}
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
