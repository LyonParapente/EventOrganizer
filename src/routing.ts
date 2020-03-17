// Similar lib: https://github.com/KidkArolis/location-bar

export var router =
{
	routes: [],
	root: '/',
	// ----------
	// Get notified every time URL changes and matches a certain regex
	add: function (re, handler)
	{
		if (typeof re === 'function')
		{
			handler = re;
			re = '';
		}
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
	navigate: function (path = '', state = null, trigger = false)
	{
		var stateObj = state || {path};
		history.pushState(stateObj, null, this.root + path);
		if (trigger)
		{
			this.check(path);
		}
		return this;
	},
	replace: function (path = '', state = null)
	{
		history.replaceState(state, null, this.root + path);
		return this;
	}
};

// Detect browser going back
window.addEventListener('popstate', function()
{
	var fragment = location.pathname + this.location.search;
	if (fragment.indexOf(router.root) === 0)
	{
		fragment = fragment.slice(router.root.length);
	}
	router.check(fragment);
});
