$(function()
{
	var $themeSelector = $('#themeSelector');

	var favoriteTheme = GetThemeCookie();
	if (favoriteTheme)
	{
		// Change combo
		$themeSelector.children("option")
			.removeAttr('selected')
			.filter("[value="+favoriteTheme+"]")
			.attr("selected", true);
	}

	$themeSelector.on("change", function()
	{
		SetTheme(this.value);
	});

	SetTheme(favoriteTheme || $themeSelector.val());

	var $currentStylesheet;
	function SetTheme(themeName)
	{
		var stylesheetUrl = "css/themes/"+themeName+".bootstrap.min.css";
		var $stylesheet = $('<link rel="stylesheet" href="' + stylesheetUrl + '"/>').appendTo('head');

		WhenStylesheetLoaded($stylesheet[0], function()
		{
			if ($currentStylesheet)
			{
				$currentStylesheet.remove();
			}
			$currentStylesheet = $stylesheet;

			var date = new Date();
			var nbDays = 400; // cookie expiration
			date.setTime(date.getTime()+(nbDays*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
			document.cookie = "theme=" + themeName + expires;
		});
	}

	function GetThemeCookie()
	{
		return document.cookie.replace(/(?:(?:^|.*;\s*)theme\s*\=\s*([^;]*).*$)|^.*$/, "$1");
	}

	function WhenStylesheetLoaded(linkNode, callback)
	{
		var isReady = false;
		function ready()
		{
			if (!isReady)
			{
				// avoid double-call
				isReady = true;
				callback();
			}
		}

		linkNode.onload = ready; // does not work cross-browser
		setTimeout(ready, 2000); // max wait. also handles browsers that don't support onload
	}
});
