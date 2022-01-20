declare class HTML5TooltipUIComponent {
	constructor();
	set(config: HTML5TooltipConfig): void;
	mount(): void;
	show(): void;
	hide():void
	destroy(): void;
	element: HTMLElement;
}

interface HTML5TooltipConfig {
	[propName: string]: string|HTMLElement;
}
