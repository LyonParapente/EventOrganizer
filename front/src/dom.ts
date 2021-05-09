export function one (el: HTMLElement, type: string, fn: (event: any) => void): void
{
    function handler (event: any)
    {
        el.removeEventListener(type, handler);
        fn(event);
    }
    el.addEventListener(type, handler);
}

var id = document.getElementById.bind(document) as (str: string) => HTMLElement;
export { id };
