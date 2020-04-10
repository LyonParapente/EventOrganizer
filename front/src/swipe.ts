// Taken & adapted from http://www.javascriptkit.com/javatutors/touchevents2.shtml
export default function swipedetector(el: HTMLElement|Document, callback: (direction: string) => void)
{
	var threshold = 150, // required min distance traveled to be considered swipe
		restraint = 100, // maximum distance allowed at the same time in perpendicular direction
		allowedTime = 300; // maximum time allowed to travel that distance

	var touchsurface = el,
	swipedir,
	startX,
	startY,
	distX,
	distY,
	elapsedTime,
	startTime,
	handleswipe = callback || function(){}; // tslint:disable-line

	touchsurface.addEventListener('touchstart', function (e: TouchEvent)
	{
		var touchobj = e.changedTouches[0];
		swipedir = 'none';
		distX = 0;
		distY = 0;
		startX = touchobj.pageX;
		startY = touchobj.pageY;
		startTime = new Date().getTime(); // record time when finger first makes contact with surface
	}, false);

	touchsurface.addEventListener('touchend', function (e: TouchEvent)
	{
		var touchobj = e.changedTouches[0];
		distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
		distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
		elapsedTime = new Date().getTime() - startTime;
		if (elapsedTime <= allowedTime) // first condition for a swipe met
		{
			if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) // 2nd condition for horizontal swipe met
			{
				swipedir = (distX < 0)? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
			}
			else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) // 2nd condition for vertical swipe met
			{
				swipedir = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
			}
		}
		handleswipe(swipedir);
	}, false);
}
