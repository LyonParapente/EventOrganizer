export function one (el: HTMLElement, type: string, fn: (event: Event) => void): void
{
    function handler (event: Event)
    {
        el.removeEventListener(type, handler);
        fn(event);
    }
    el.addEventListener(type, handler);
}

var id = document.getElementById.bind(document) as (str: string) => HTMLElement;
export { id };
