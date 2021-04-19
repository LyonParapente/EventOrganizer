export function one (el: HTMLElement, type: string, fn: Function): void
{
    function handler (event: any)
    {
        el.removeEventListener(type, handler);
        fn(event);
    }
    el.addEventListener(type, handler);
}
