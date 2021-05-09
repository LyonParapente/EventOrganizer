
interface Tooltip
{
	set(config: TooltipConfig): void;
	mount(): void;
	show(): void;
	destroy(): void;
}

interface TooltipConfig {
	[propName: string]: string|HTMLElement;
}
