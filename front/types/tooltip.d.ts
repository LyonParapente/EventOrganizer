declare class HTML5TooltipUIComponent {
	constructor();
	set(config: HTML5TooltipConfig): void;
	mount(): void;
	show(): void;
	destroy(): void;
}

interface HTML5TooltipConfig {
	[propName: string]: string|HTMLElement;
}
