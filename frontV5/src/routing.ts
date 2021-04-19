// Similar lib: https://github.com/KidkArolis/location-bar

type RoutePath = string|RegExp;

interface Route
{
	re: RoutePath;
	handler: Function;
}

interface Router
{
	routes: Route[];
	root: string;
	add (re: RoutePath, handler: (...args: string[]) => void): Router;
	remove (param: RoutePath|Function): Router;
	check (path: string): Router;
	navigate (path: string, title?: string, state?: object|null, trigger?: boolean): Router;
	replace (path: string, title?: string, state?: object|null): Router;
	title (text: string): void;
}

export var router: Router =
{
	routes: [],
	root: '/',
	// ----------
	// Get notified every time URL changes and matches a certain regex
	add: function (re, handler)
	{
		this.routes.push({re, handler});
		return this;
	},
	remove: function (param)
	{
		for (var i = 0; i < this.routes.length; i++)
		{
			var r = this.routes[i];
			if (r.handler === param || r.re.toString() === param.toString())
			{
				this.routes.splice(i, 1);
				return this;
			}
		}
		return this;
	},
	check: function (path)
	{
		for (var i = 0; i < this.routes.length; i++)
		{
			var match = path.match(this.routes[i].re);
			if (match)
			{
				match.shift();
				this.routes[i].handler.apply({}, match);
				return this;
			}
		}
		return this;
	},
	navigate: function (path = '', title = '', state = null, trigger = false)
	{
		var stateObj = state || {path};
		try
		{
			history.pushState(stateObj, title, this.root + path);
		}
		catch (ex) { }
		this.title(title);
		if (trigger)
		{
			this.check(path);
		}
		return this;
	},
	replace: function (path = '', title = '', state = null)
	{
		try
		{
			history.replaceState(state, title, this.root + path);
		}
		catch (ex) { }
		this.title(title);
		return this;
	},
	title: function (text)
	{
		if (text === null) return;
		try
		{
			document.getElementsByTagName('title')[0].innerHTML = text.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
		}
		catch (ex) { }
	}
};

// Detect browser going back
window.addEventListener('popstate', function ()
{
	if (this.location.href.charAt(this.location.href.length - 1) === '#')
	{
		// Click on dummy <a href="#"> ; do nothing
		return;
	}
	var fragment = location.pathname + this.location.search;
	if (fragment.indexOf(router.root) === 0)
	{
		fragment = fragment.slice(router.root.length);
	}
	router.check(fragment);
});
