export function one (el: HTMLElement, type: string, fn: Function): void
{
    function handler (event)
    {
        el.removeEventListener(type, handler);
        fn(event);
    }
    el.addEventListener(type, handler);
}
