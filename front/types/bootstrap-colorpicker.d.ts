interface BootstrapColorpickerOptionsSlider {
  selector: string | JQuery;
  maxLeft: number;
  maxTop: number;
  callLeft: string;
  callTop: string;
}

interface BootstrapColorpickerOptions {
  /**
   * Custom class to be added to the `.colorpicker-element` element
   *
   * @type {String|null}
   * @default null
   */
  customClass?: string;
  /**
   * Sets a initial color, ignoring the one from the element/input value or the data-color attribute.
   *
   * @type {(String|ColorItem|boolean)}
   * @default false
   */
  color?: string;
  /**
   * Fallback color to use when the given color is invalid.
   * If false, the latest valid color will be used as a fallback.
   *
   * @type {String|ColorItem|boolean}
   * @default false
   */
  fallbackColor?: string;
  /**
   * Forces an specific color format. If 'auto', it will be automatically detected the first time only,
   * but if null it will be always recalculated.
   *
   * Note that the ending 'a' of the format meaning "alpha" has currently no effect, meaning that rgb is the same as
   * rgba excepting if the alpha channel is disabled (see useAlpha).
   *
   * @type {('rgb'|'hex'|'hsl'|'auto'|null)}
   * @default 'auto'
   */
  format?: 'rgb'|'hex'|'hsl'|'auto'|null;
  /**
   * Horizontal mode layout.
   *
   * If true, the hue and alpha channel bars will be rendered horizontally, above the saturation selector.
   *
   * @type {boolean}
   * @default false
   */
  horizontal?: boolean;
  /**
   * Forces to show the colorpicker as an inline element.
   *
   * Note that if there is no container specified, the inline element
   * will be added to the body, so you may want to set the container option.
   *
   * @type {boolean}
   * @default false
   */
  inline?: boolean;
  /**
   * Container where the colorpicker is appended to in the DOM.
   *
   * If is a string (CSS selector), the colorpicker will be placed inside this container.
   * If true, the `.colorpicker-element` element itself will be used as the container.
   * If false, the document body is used as the container, unless it is a popover (in this case it is appended to the
   * popover body instead).
   *
   * @type {String|boolean}
   * @default false
   */
  container?: string|boolean;
  /**
   * Bootstrap Popover options.
   * The trigger, content and html options are always ignored.
   *
   * @type {boolean}
   * @default Object
   */
  popover?: {
    animation: boolean;
    placement: string;
    fallbackPlacement: string;
  };
  /**
   * If true, loads the 'debugger' extension automatically, which logs the events in the console
   * @type {boolean}
   * @default false
   */
  debug?: boolean;
  /**
   * Child CSS selector for the colorpicker input.
   *
   * @type {String}
   * @default 'input'
   */
  input?: string;
  /**
   * Child CSS selector for the colorpicker addon.
   * If it exists, the child <i> element background will be changed on color change.
   *
   * @type {String}
   * @default '.colorpicker-trigger, .colorpicker-input-addon'
   */
  addon?: string;
  /**
   * If true, the input content will be replaced always with a valid color,
   * if false, the invalid color will be left in the input,
   *   while the internal color object will still resolve into a valid one.
   *
   * @type {boolean}
   * @default true
   */
  autoInputFallback?: boolean;
  /**
   * If true a hash will be prepended to hexadecimal colors.
   * If false, the hash will be removed.
   * This only affects the input values in hexadecimal format.
   *
   * @type {boolean}
   * @default true
   */
  useHashPrefix?: boolean;
  /**
   * If true, the alpha channel bar will be displayed no matter what.
   *
   * If false, it will be always hidden and alpha channel will be disabled also programmatically, meaning that
   * the selected or typed color will be always opaque.
   *
   * If null, the alpha channel will be automatically disabled/enabled depending if the initial color format supports
   * alpha or not.
   *
   * @type {boolean}
   * @default true
   */
  useAlpha?: boolean;
  /**
   * Colorpicker widget template
   * @type {String}
   * @example
   * <!-- This is the default template: -->
   * <div class="colorpicker">
   *   <div class="colorpicker-saturation"><i class="colorpicker-guide"></i></div>
   *   <div class="colorpicker-hue"><i class="colorpicker-guide"></i></div>
   *   <div class="colorpicker-alpha">
   *     <div class="colorpicker-alpha-color"></div>
   *     <i class="colorpicker-guide"></i>
   *   </div>
   * </div>
   */
  template?: string;
  /**
   *
   * Associative object with the extension class name and its config.
   * Colorpicker comes with many bundled extensions: debugger, palette, preview and swatches (a superset of palette).
   *
   * @type {Object[]}
   * @example
   *   extensions: [
   *     {
   *       name: 'swatches'
   *       options: {
   *         colors: {
   *           'primary': '#337ab7',
   *           'success': '#5cb85c',
   *           'info': '#5bc0de',
   *           'warning': '#f0ad4e',
   *           'danger': '#d9534f'
   *         },
   *         namesAsValues: true
   *       }
   *     }
   *   ]
   */
  extensions?: object;
  /**
   * Vertical sliders configuration
   * @type {Object}
   */
  sliders?: {
    saturation: BootstrapColorpickerOptionsSlider;
    hue: BootstrapColorpickerOptionsSlider;
    alpha: BootstrapColorpickerOptionsSlider;
  };
  /**
   * Horizontal sliders configuration
   * @type {Object}
   */
  slidersHorz?: {
    saturation: BootstrapColorpickerOptionsSlider;
    hue: BootstrapColorpickerOptionsSlider;
    alpha: BootstrapColorpickerOptionsSlider;
  };
}

interface BootstrapColorpicker {
    /**
     * Access to the colorpicker Color object information
     */
    color: BootstrapColorpickerColor;

    setValue(value: string): string;
    destroy(): void;
    disable(): boolean;
    enable(): boolean;
    getValue(defaultValue?: string): string;
    hide(e?: Event): void;
    isDisabled(): boolean;
    isEnabled(): boolean;
    //registerExtension(ExtensionClass?: string, config?: object): Extension;
    setValue(value?: string): string;
    show(e?: Event): void;
    toggle(e?: Event): void;
    trigger(eventName?: string, color?: string, value?: string): void;
    update(): void;
}

interface BootstrapColorpickerEvent extends Event {
  color: BootstrapColorpickerColor;
}

interface BootstrapColorpickerColor {
  isHex(str: string): boolean;
  parse(color: string): string;
  sanitizeFormat(format: string): string;
  sanitizeString(str: string): string;
  equals(color: string): boolean;
  generate(formula: string): [string];
  getClone(): BootstrapColorpickerColor;
  getCloneHueOnly(): BootstrapColorpickerColor;
  getCloneOpaque(): BootstrapColorpickerColor;
  hasAlpha(): boolean;
  hasTransparency(): boolean;
  isDark(): boolean;
  isDesaturated(): boolean;
  isLight(): boolean;
  isTransparent(): boolean;
  isValid(): boolean;
  replace(color: string, format: string): void;
  string(format: string): string;
  toHexString(): string;
  toHslString(): string;
  toHsva(): object;
  toObject(): object;
  toRgbString(): string;
  toString(): string;
}

interface JQueryStatic {
  colorpicker: BootstrapColorpicker;
}

interface JQuery {
  /**
   * Initializes an colorpicker.
   */
  colorpicker(options?: BootstrapColorpickerOptions): JQuery;

  colorpicker(method: 'destroy'): void;
  colorpicker(method: 'disable'): boolean;
  colorpicker(method: 'enable'): boolean;
  colorpicker(method: 'getValue', defaultValue?: string): string;
  colorpicker(method: 'hide', e?: Event): void;
  colorpicker(method: 'isDisabled'): boolean;
  colorpicker(method: 'isEnabled'): boolean;
  //colorpicker(method: 'registerExtension', ExtensionClass?: string, config?: object): Extension;
  colorpicker(method: 'setValue', value?: string): string;
  colorpicker(method: 'show', e?: Event): void;
  colorpicker(method: 'toggle', e?: Event): void;
  colorpicker(method: 'trigger', eventName?: string, color?: string, value?: string): void;
  colorpicker(method: 'update'): void;

  data(key: 'colorpicker'): BootstrapColorpicker;

  on(events: 'create', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'destroy', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'update', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'change', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'invalid', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'hide', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'show', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'disable', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
  on(events: 'enable', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;


  on(events: 'colorpickerChange', handler?: (eventObject: BootstrapColorpickerEvent) => any): JQuery;
}
