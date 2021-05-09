
interface SimpleColorPicker
{
	onChange(fn: (hexStringColor: string)=>void): void;
	setColor(color: string): void;
	isDark(): boolean;
}
