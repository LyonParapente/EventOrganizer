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
